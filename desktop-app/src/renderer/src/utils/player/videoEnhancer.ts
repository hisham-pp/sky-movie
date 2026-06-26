// Real-time WebGL2 video enhancement — adaptive sharpening, bilateral denoise, vibrance.
// Works on both MPV (<canvas>) and ArtPlayer (<video>) source elements.

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTex;
uniform vec2      uTexel;   // 1.0 / resolution
uniform float     uSharp;   // 0-1
uniform float     uDenoise; // 0-1
uniform float     uVibr;    // 0-1

void main() {
  vec3 c = texture(uTex, vUv).rgb;

  // Sample 3×3 neighborhood once
  vec3 neighbors[9];
  int idx = 0;
  for (int dx = -1; dx <= 1; dx++) {
    for (int dy = -1; dy <= 1; dy++) {
      neighbors[idx++] = texture(uTex, vUv + vec2(float(dx), float(dy)) * uTexel).rgb;
    }
  }
  // n[4] == center, but we already have c = texture(uTex, vUv)

  vec3 blur = (neighbors[0]+neighbors[1]+neighbors[2]+
               neighbors[3]+neighbors[4]+neighbors[5]+
               neighbors[6]+neighbors[7]+neighbors[8]) / 9.0;

  // Bilateral-like denoise: weight neighbors by color similarity to center
  if (uDenoise > 0.0) {
    vec3 acc = vec3(0.0);
    float wSum = 0.0;
    for (int i = 0; i < 9; i++) {
      float diff = length(neighbors[i] - c);
      float w = exp(-diff * diff * 60.0);
      acc += neighbors[i] * w;
      wSum += w;
    }
    c = mix(c, acc / wSum, uDenoise * 0.65);
  }

  // Adaptive unsharp mask: amplify high-frequency edges
  if (uSharp > 0.0) {
    vec3 highFreq = c - blur;
    float edgeMag = length(highFreq);
    float adaptive = uSharp * (0.8 + edgeMag * 3.0); // stronger on edges
    c = c + highFreq * adaptive * 1.4;
  }

  // Vibrance: selectively boost desaturated pixels
  if (uVibr > 0.0) {
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float mx  = max(c.r, max(c.g, c.b));
    float mn  = min(c.r, min(c.g, c.b));
    float sat = (mx - mn) / max(mx, 0.001);
    float boost = uVibr * (1.0 - sat) * 0.55;
    c = mix(vec3(lum), c, 1.0 + boost);
  }

  fragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

export interface VideoEnhancerParams {
  sharpness:  number; // 0–1
  denoise:    number; // 0–1
  colorBoost: number; // 0–1
}

export class VideoEnhancer {
  private overlay:  HTMLCanvasElement | null = null;
  private gl:       WebGL2RenderingContext  | null = null;
  private program:  WebGLProgram           | null = null;
  private tex:      WebGLTexture           | null = null;
  private source:   HTMLCanvasElement | HTMLVideoElement | null = null;
  private rafId     = 0;
  private params: VideoEnhancerParams = { sharpness: 0.55, denoise: 0.35, colorBoost: 0.3 };

  private ulocs: {
    uTex:    WebGLUniformLocation | null;
    uTexel:  WebGLUniformLocation | null;
    uSharp:  WebGLUniformLocation | null;
    uDenoise:WebGLUniformLocation | null;
    uVibr:   WebGLUniformLocation | null;
  } = { uTex: null, uTexel: null, uSharp: null, uDenoise: null, uVibr: null };

  /** Attach an overlay canvas to `source`'s parent. Returns false if WebGL2 unavailable. */
  enable(source: HTMLCanvasElement | HTMLVideoElement): boolean {
    this.disable();
    const parent = source.parentElement;
    if (!parent) return false;

    const overlay = document.createElement('canvas');
    overlay.style.cssText = [
      'position:absolute', 'inset:0', 'width:100%', 'height:100%',
      'pointer-events:none', 'z-index:3', 'display:block',
    ].join(';');
    parent.appendChild(overlay);

    const gl = overlay.getContext('webgl2');
    if (!gl) { overlay.remove(); return false; }

    const prog = this.buildProgram(gl);
    if (!prog) { overlay.remove(); return false; }

    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const p = gl.TEXTURE_2D;
    gl.texParameteri(p, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(p, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(p, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(p, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Fullscreen quad
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(prog);
    this.ulocs = {
      uTex:     gl.getUniformLocation(prog, 'uTex'),
      uTexel:   gl.getUniformLocation(prog, 'uTexel'),
      uSharp:   gl.getUniformLocation(prog, 'uSharp'),
      uDenoise: gl.getUniformLocation(prog, 'uDenoise'),
      uVibr:    gl.getUniformLocation(prog, 'uVibr'),
    };

    this.overlay = overlay;
    this.gl = gl;
    this.program = prog;
    this.tex = tex;
    this.source = source;
    this.tick();
    return true;
  }

  disable() {
    cancelAnimationFrame(this.rafId);
    this.overlay?.remove();
    if (this.gl && this.tex) this.gl.deleteTexture(this.tex);
    this.overlay = this.gl = this.program = this.tex = this.source = null;
    this.rafId = 0;
  }

  setParams(p: Partial<VideoEnhancerParams>) {
    Object.assign(this.params, p);
  }

  private tick = () => {
    this.rafId = requestAnimationFrame(this.tick);
    const { gl, overlay, source, program, tex, ulocs, params } = this;
    if (!gl || !overlay || !source || !program || !tex) return;

    const srcW = (source as HTMLCanvasElement).width  || (source as HTMLVideoElement).videoWidth  || 0;
    const srcH = (source as HTMLCanvasElement).height || (source as HTMLVideoElement).videoHeight || 0;
    if (!srcW || !srcH) return;

    if (overlay.width !== srcW || overlay.height !== srcH) {
      overlay.width  = srcW;
      overlay.height = srcH;
      gl.viewport(0, 0, srcW, srcH);
    }

    gl.useProgram(program);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source as TexImageSource);
    } catch { return; }

    gl.uniform1i(ulocs.uTex, 0);
    gl.uniform2f(ulocs.uTexel, 1 / srcW, 1 / srcH);
    gl.uniform1f(ulocs.uSharp,   params.sharpness);
    gl.uniform1f(ulocs.uDenoise, params.denoise);
    gl.uniform1f(ulocs.uVibr,    params.colorBoost);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  private buildProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
    const vs = this.compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = this.compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[VideoEnhancer] link error:', gl.getProgramInfoLog(prog));
      return null;
    }
    return prog;
  }

  private compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('[VideoEnhancer] shader error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
}
