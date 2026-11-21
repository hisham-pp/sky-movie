// SVG filter-based video enhancement — sharpening via unsharp mask + color boost.
// Uses the browser's native filter compositor (GPU-accelerated in Chromium/Electron).

const FILTER_ID = 'sky-ai-video-enhance';

export interface VideoEnhancerParams {
  sharpness:  number; // 0–1
  denoise:    number; // 0–1
  colorBoost: number; // 0–1
}

export class VideoEnhancer {
  private svgEl: SVGSVGElement | null = null;

  /** Insert the SVG filter definition into the document. Safe to call multiple times. */
  ensureFilter(): void {
    if (document.getElementById(FILTER_ID)) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;pointer-events:none;width:0;height:0;overflow:hidden;';
    // Unsharp-mask filter: blur SourceGraphic, then composite(src, blur) = k2*src + k3*blur
    // With k2 = 1+s, k3 = -s  →  src + s*(src-blur)  →  classic unsharp mask
    svg.innerHTML = `<defs>
      <filter id="${FILTER_ID}" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="blurred"/>
        <feComposite in="SourceGraphic" in2="blurred" operator="arithmetic"
          k1="0" k2="1.55" k3="-0.55" k4="0"/>
      </filter>
    </defs>`;
    document.body.appendChild(svg);
    this.svgEl = svg;
  }

  remove(): void {
    this.svgEl?.remove();
    this.svgEl = null;
  }

  /** Update the SVG filter nodes when user drags sliders. */
  updateParams({ sharpness, denoise }: VideoEnhancerParams): void {
    const svgEl = this.svgEl ?? (document.getElementById(FILTER_ID)?.closest('svg') as SVGSVGElement | null);
    if (!svgEl) return;
    const feBlur = svgEl.querySelector('feGaussianBlur');
    const feComp = svgEl.querySelector('feComposite');
    // blur stdDeviation: 0 → 0.3 (minimum, needed as reference), 1 → 1.8
    if (feBlur) feBlur.setAttribute('stdDeviation', (0.3 + denoise * 1.5).toFixed(2));
    if (feComp) {
      const k2 = (1 + sharpness * 1.6).toFixed(3);
      const k3 = (-sharpness * 1.6).toFixed(3);
      feComp.setAttribute('k2', k2);
      feComp.setAttribute('k3', k3);
    }
  }

  /** Build the CSS filter string that references the SVG filter plus color adjustments. */
  static buildFilterString(
    aiOn: boolean,
    colorBoost: number,
    brightness: number,
    contrast: number,
    saturation: number,
  ): string {
    const parts: string[] = [];

    if (aiOn) {
      parts.push(`url(#${FILTER_ID})`);
      // Vibrance-like color boost: add extra saturation on top
      const sat = 1 + colorBoost * 0.5;
      if (sat > 1.005) parts.push(`saturate(${sat.toFixed(3)})`);
      // Subtle micro-contrast from sharpening
      parts.push('contrast(1.03)');
    }

    // Basic manual enhancement — always applied when non-default
    if (brightness !== 100)  parts.push(`brightness(${(brightness  / 100).toFixed(3)})`);
    if (contrast   !== 100)  parts.push(`contrast(${(contrast    / 100).toFixed(3)})`);
    if (saturation !== 100)  parts.push(`saturate(${(saturation  / 100).toFixed(3)})`);

    return parts.length ? parts.join(' ') : '';
  }

  static readonly FILTER_ID = FILTER_ID;
}
