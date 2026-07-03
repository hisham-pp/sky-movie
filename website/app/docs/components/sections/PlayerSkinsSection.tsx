const skinClassCode = `import './YourSkin.css';
import { PlayerSkin } from '../PlayerSkin';
import type { PlayerKeyMap, SkinControlsProps } from '../PlayerSkin';

export class YourSkin extends PlayerSkin {
  readonly id = 'your-skin' as const;
  readonly name = 'Your Skin';
  readonly description = 'A short description shown in settings.';

  // Optional: override max volume (default 100)
  readonly volumeMax = 100;

  // Optional: allow audio boost above 100 (set 0 to disable)
  readonly volumeBoostMax = 0;

  readonly keyMap: PlayerKeyMap = {
    togglePlay:              [' ', 'k'],
    seekBack:                ['ArrowLeft'],
    seekForward:             ['ArrowRight'],
    seekBackLarge:           ['j'],
    seekForwardLarge:        ['l'],
    volumeUp:                ['ArrowUp'],
    volumeDown:              ['ArrowDown'],
    toggleMute:              ['m'],
    toggleFullscreen:        ['f', 'F'],
    seekBackSeconds:         5,
    seekForwardSeconds:      5,
    seekBackLargeSeconds:    10,
    seekForwardLargeSeconds: 10,
  };

  renderControls(props: SkinControlsProps) {
    return <YourControls props={props} skin={this} />;
  }
}

function YourControls({ props, skin }: { props: SkinControlsProps; skin: YourSkin }) {
  const { state, isVisible, onTogglePlay, onToggleFullscreen } = props;

  return (
    <div className={\`your-controls\${isVisible ? ' visible' : ''}\`}>
      {/* Build your UI here */}
      <button onClick={onTogglePlay}>
        {state.playing ? 'Pause' : 'Play'}
      </button>
      <button onClick={onToggleFullscreen}>Fullscreen</button>
    </div>
  );
}`;

const SKIN_CONTROLS_PROPS: Array<[string, string, string]> = [
  ["state", "SkinPlayerState", "playing, position, duration, volume, muted, speed, buffering"],
  ["tracks", "SkinTrack[]", "All audio, subtitle, and video tracks reported by mpv"],
  ["isVisible", "boolean", "Whether the controls overlay should be shown (mouse idle hides it)"],
  ["seekOsdVisible", "boolean", "True when the user seeks with keys while controls are hidden — show a minimal seek indicator"],
  ["isFullscreen", "boolean", "Whether the player is currently fullscreen"],
  ["showMenu", "'settings' | null", "Which dropdown is open; set via onSetShowMenu"],
  ["sidecarSubtitles", "SkinSidecar[]", "External subtitle files found alongside the media file"],
  ["onTogglePlay()", "() => void", "Toggle play/pause"],
  ["onToggleMute()", "() => void", "Toggle mute (restores previous volume on unmute)"],
  ["onChangeVolume(v)", "(v: number) => void", "Set volume (0 – volumeMax + volumeBoostMax)"],
  ["onToggleFullscreen()", "() => void", "Enter or exit fullscreen"],
  ["onSeekTo(seconds)", "(s: number) => void", "Seek to an absolute position in seconds"],
  ["onSetSpeed(s)", "(s: number) => void", "Set playback speed (e.g. 0.5, 1, 1.5, 2)"],
  ["onSetAudioTrack(id)", "(id: number) => void", "Switch to an audio track by its mpv track id"],
  ["onSetSubTrack(id)", "(id: number) => void", "Switch to a subtitle track (pass 0 to disable)"],
  ["onSetSubFile(path)", "(path: string) => void", "Load an external subtitle file by absolute path"],
  ["onSetShowMenu(m)", "(m: 'settings' | null) => void", "Open or close the settings dropdown"],
  ["onSeekBarDown/Move/Up", "PointerEvent handler", "Pointer event handlers for a custom seek bar — wire these to your seek track element"],
];

export function PlayerSkinsSection() {
  return (
    <section id="player-skins" className="scroll-mt-28 space-y-8">
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-2xl lg:text-3xl text-white font-bold tracking-tight mb-2">Custom Player Skins</h2>
        <p className="text-secondary text-sm">Sky Movie's player UI is fully skinnable. Each skin is a TypeScript class that defines its own controls, keyboard shortcuts, and volume limits.</p>
      </div>

      {/* Overview */}
      <p className="text-secondary text-sm leading-relaxed">
        Skins live under <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">desktop-app/src/renderer/src/theme/player-skins/</code>.
        Each skin gets its own subfolder, extends the abstract <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">PlayerSkin</code> class, and is registered in
        <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white"> index.ts</code>.
        Once registered, users can select it from <strong className="text-white">Settings → Appearance → Player Style</strong>.
      </p>

      {/* File layout */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white">File Layout</h3>
        <div className="bg-black/35 p-5 rounded-2xl font-mono text-xs text-white/70 space-y-1 overflow-x-auto leading-relaxed border border-white/5">
          <div>📁 theme/player-skins/</div>
          <div>├── 📄 PlayerSkin.ts         <span className="text-white/30">← abstract base class</span></div>
          <div>├── 📄 index.ts              <span className="text-white/30">← skin registry</span></div>
          <div>├── 📁 default/</div>
          <div>│   ├── 📄 DefaultSkin.tsx</div>
          <div className="text-primary">│   └── 📄 DefaultSkin.css</div>
          <div>└── 📁 your-skin/            <span className="text-white/30">← your new skin goes here</span></div>
          <div className="text-primary">    ├── 📄 YourSkin.tsx</div>
          <div className="text-primary">    └── 📄 YourSkin.css</div>
        </div>
      </div>

      {/* Step 1 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <span className="w-7 h-7 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">1</span>
          Add the PlayerStyle id to the union type
        </h3>
        <p className="text-secondary text-sm leading-relaxed">
          Open <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">desktop-app/src/shared/ipc.ts</code> and extend the union:
        </p>
        <div className="bg-black/35 rounded-2xl overflow-hidden border border-white/5">
          <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-xs text-white/40 font-mono">src/shared/ipc.ts</div>
          <pre className="p-5 text-xs font-mono text-white/80 overflow-x-auto leading-relaxed">{`// Before
export type PlayerStyle = 'default';

// After
export type PlayerStyle = 'default' | 'your-skin';`}</pre>
        </div>
      </div>

      {/* Step 2 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <span className="w-7 h-7 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">2</span>
          Create the skin class
        </h3>
        <p className="text-secondary text-sm leading-relaxed">
          Create <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">theme/player-skins/your-skin/YourSkin.tsx</code> and extend <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">PlayerSkin</code>:
        </p>
        <div className="bg-black/35 rounded-2xl overflow-hidden border border-white/5">
          <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-xs text-white/40 font-mono">your-skin/YourSkin.tsx</div>
          <pre className="p-5 text-xs font-mono text-white/80 overflow-x-auto leading-relaxed">{skinClassCode}</pre>
        </div>
      </div>

      {/* Step 3 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <span className="w-7 h-7 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">3</span>
          Register the skin
        </h3>
        <p className="text-secondary text-sm leading-relaxed">
          Open <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">theme/player-skins/index.ts</code> and add one import + one entry:
        </p>
        <div className="bg-black/35 rounded-2xl overflow-hidden border border-white/5">
          <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-xs text-white/40 font-mono">theme/player-skins/index.ts</div>
          <pre className="p-5 text-xs font-mono text-white/80 overflow-x-auto leading-relaxed">{`import { DefaultSkin } from './default/DefaultSkin';
import { YourSkin } from './your-skin/YourSkin'; // add this

const registry: Record<PlayerStyle, PlayerSkin> = {
  default:    new DefaultSkin(),
  'your-skin': new YourSkin(),               // add this
};`}</pre>
        </div>
      </div>

      {/* Step 4 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <span className="w-7 h-7 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">4</span>
          Add the skin to the Settings panel
        </h3>
        <p className="text-secondary text-sm leading-relaxed">
          In <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">components/SettingsPanel.tsx</code>, add your skin to the <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">playerStylePresets</code> array so users can select it:
        </p>
        <div className="bg-black/35 rounded-2xl overflow-hidden border border-white/5">
          <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-xs text-white/40 font-mono">components/SettingsPanel.tsx</div>
          <pre className="p-5 text-xs font-mono text-white/80 overflow-x-auto leading-relaxed">{`const playerStylePresets = [
  { id: 'default',   name: 'Default',   description: 'Standard controls.' },
  { id: 'your-skin', name: 'Your Skin', description: 'Your custom skin.' },
];`}</pre>
        </div>
      </div>

      {/* Step 5 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <span className="w-7 h-7 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">5</span>
          Add your CSS
        </h3>
        <p className="text-secondary text-sm leading-relaxed">
          Create <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">your-skin/YourSkin.css</code>. It is imported directly in <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">YourSkin.tsx</code> so Vite bundles it automatically — no global import needed.
          Tailwind utility classes work too. Use a unique prefix for your class names to avoid conflicts with other skins.
        </p>
      </div>

      {/* API reference */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">SkinControlsProps reference</h3>
        <p className="text-secondary text-sm leading-relaxed">
          Your <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs text-white">renderControls()</code> receives these props:
        </p>
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-left border-collapse bg-surface/20">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-4 text-xs font-semibold text-white/60 uppercase">Prop</th>
                <th className="p-4 text-xs font-semibold text-white/60 uppercase">Type</th>
                <th className="p-4 text-xs font-semibold text-white/60 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {SKIN_CONTROLS_PROPS.map(([prop, type, desc]) => (
                <tr key={prop}>
                  <td className="p-4 font-mono text-primary text-xs">{prop}</td>
                  <td className="p-4 font-mono text-white/60 text-xs">{type}</td>
                  <td className="p-4 text-secondary text-xs leading-relaxed">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white">Tips</h3>
        <div className="space-y-3">
          <div className="glass-panel p-5 rounded-2xl flex gap-4">
            <span className="material-symbols-outlined text-primary flex-shrink-0">lightbulb</span>
            <p className="text-secondary text-sm leading-relaxed">
              <strong className="text-white">Use hooks freely.</strong> Your <code className="bg-white/5 px-1 rounded font-mono text-xs">renderControls()</code> should return a JSX element rendered by an inner function component — that way you can use <code className="bg-white/5 px-1 rounded font-mono text-xs">useState</code> and <code className="bg-white/5 px-1 rounded font-mono text-xs">useEffect</code> for local UI state like OSD timers or hover effects.
            </p>
          </div>
          <div className="glass-panel p-5 rounded-2xl flex gap-4">
            <span className="material-symbols-outlined text-primary flex-shrink-0">lightbulb</span>
            <p className="text-secondary text-sm leading-relaxed">
              <strong className="text-white">seekOsdVisible vs isVisible.</strong> When the user presses arrow keys with controls hidden, <code className="bg-white/5 px-1 rounded font-mono text-xs">isVisible</code> stays false but <code className="bg-white/5 px-1 rounded font-mono text-xs">seekOsdVisible</code> turns true for 1.5 seconds. Use it to show a minimal seek indicator without revealing the full controls bar.
            </p>
          </div>
          <div className="glass-panel p-5 rounded-2xl flex gap-4">
            <span className="material-symbols-outlined text-primary flex-shrink-0">lightbulb</span>
            <p className="text-secondary text-sm leading-relaxed">
              <strong className="text-white">Engine-level classes stay <code className="bg-white/5 px-1 rounded font-mono text-xs">mpv-*</code>.</strong> The canvas, buffering spinner, error overlay, and skip ripples are rendered by <code className="bg-white/5 px-1 rounded font-mono text-xs">MpvPlayer.tsx</code> and always use the <code className="bg-white/5 px-1 rounded font-mono text-xs">mpv-</code> prefix. Your skin only needs to style what's inside <code className="bg-white/5 px-1 rounded font-mono text-xs">renderControls()</code>.
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}
