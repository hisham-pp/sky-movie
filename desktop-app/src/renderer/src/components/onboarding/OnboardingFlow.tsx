import { memo, useCallback, useEffect, useState } from 'react';
import {
  Clapperboard, FolderPlus, X, ChevronLeft, ChevronRight, Check,
  Sparkles, Search, SlidersHorizontal, ArrowUpDown, Heart, History, ListMusic,
  Keyboard, Volume2, Captions, Wand2, Maximize, Cpu, Play, Trash2, ScanLine
} from 'lucide-react';
import type { AppSettings } from '@shared/ipc';
import { Switch, GlassSelect } from '../common';
import type { GlassSelectOption } from '../common';

const TOTAL_STEPS = 6;

const LANGUAGE_OPTIONS: GlassSelectOption<string>[] = [
  { value: '', label: 'Auto / None' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'ta', label: 'Tamil' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' }
];

const LIBRARY_FEATURES = [
  { icon: <Search size={18} />,           title: 'Search',            desc: 'Press Ctrl+K to jump to any movie, show, or playlist.' },
  { icon: <SlidersHorizontal size={18} />, title: 'Filters',           desc: 'Narrow the library by year, rating, and favorites.' },
  { icon: <ArrowUpDown size={18} />,       title: 'Sorting',           desc: 'Order by title, release year, or rating.' },
  { icon: <Heart size={18} />,             title: 'Favorites',         desc: 'Star titles to keep them one click away.' },
  { icon: <History size={18} />,           title: 'Continue Watching', desc: 'Resume right where you left off.' },
  { icon: <ListMusic size={18} />,         title: 'Playlists',         desc: 'Group movies and episodes and play them back to back.' }
];

const PLAYER_FEATURES = [
  { icon: <Keyboard size={18} />, title: 'Keyboard Shortcuts', desc: 'Press Ctrl+/ any time to see the full list.' },
  { icon: <Volume2 size={18} />,  title: 'Audio Tracks',       desc: 'Switch languages with Ctrl+H during playback.' },
  { icon: <Captions size={18} />, title: 'Subtitles',          desc: 'Cycle subtitle tracks with Ctrl+J.' },
  { icon: <Wand2 size={18} />,    title: 'Video Enhancement',  desc: 'Fine-tune sharpness, color, and audio in the player.' },
  { icon: <Maximize size={18} />, title: 'Fullscreen',         desc: 'Press F to go fullscreen, Esc to exit.' }
];

interface OnboardingFlowProps {
  settings: AppSettings;
  libraryFolders: string[];
  busy: boolean;
  onSave(update: Partial<AppSettings>): void;
  onChooseFolders(): void;
  onRemoveFolder(path: string): void;
  onScan(): void;
  onClose(): void;
}

export const OnboardingFlow = memo(function OnboardingFlow({
  settings,
  libraryFolders,
  busy,
  onSave,
  onChooseFolders,
  onRemoveFolder,
  onScan,
  onClose
}: OnboardingFlowProps) {
  // Resume at the last-viewed step so closing mid-tour doesn't lose progress.
  const [step, setStep] = useState(() => Math.min(TOTAL_STEPS - 1, Math.max(0, settings.onboardingStep ?? 0)));
  const [scanRequested, setScanRequested] = useState(false);

  const goTo = useCallback((next: number) => {
    const clamped = Math.min(TOTAL_STEPS - 1, Math.max(0, next));
    setStep(clamped);
    onSave({ onboardingStep: clamped });
  }, [onSave]);

  const finish = useCallback(() => {
    onSave({ onboardingCompleted: true, onboardingStep: 0 });
    // Kick off a scan on the way out if the user asked for it and added folders.
    if (scanRequested && libraryFolders.length > 0) onScan();
    onClose();
  }, [onSave, onClose, onScan, scanRequested, libraryFolders.length]);

  const skip = useCallback(() => {
    onSave({ onboardingCompleted: true, onboardingStep: 0 });
    onClose();
  }, [onSave, onClose]);

  // Esc skips the tour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); skip(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [skip]);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const isFirst = step === 0;
  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card" role="dialog" aria-modal="true" aria-label="Welcome tour">
        <button className="onboarding-skip" onClick={skip} title="Skip tour (Esc)">
          <X size={16} /> Skip
        </button>

        <div className="onboarding-progress">
          <div className="onboarding-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="onboarding-step-count">Step {step + 1} of {TOTAL_STEPS}</span>

        <div className="onboarding-body">
          {step === 0 && <WelcomeStep />}
          {step === 1 && (
            <MediaSetupStep
              libraryFolders={libraryFolders}
              busy={busy}
              scanRequested={scanRequested}
              onToggleScan={setScanRequested}
              onChooseFolders={onChooseFolders}
              onRemoveFolder={onRemoveFolder}
            />
          )}
          {step === 2 && <PlayerConfigStep settings={settings} onSave={onSave} />}
          {step === 3 && <FeatureGridStep title="Library Features" subtitle="Everything you need to find and organize your collection." features={LIBRARY_FEATURES} />}
          {step === 4 && <FeatureGridStep title="Player Features" subtitle="Powerful playback controls, a keystroke away." features={PLAYER_FEATURES} />}
          {step === 5 && <FinishStep />}
        </div>

        <div className="onboarding-footer">
          <button className="onboarding-btn onboarding-btn--ghost" onClick={() => goTo(step - 1)} disabled={isFirst}>
            <ChevronLeft size={16} /> Back
          </button>
          {isLast ? (
            <button className="onboarding-btn onboarding-btn--primary" onClick={finish}>
              <Check size={16} /> Start Browsing
            </button>
          ) : (
            <button className="onboarding-btn onboarding-btn--primary" onClick={() => goTo(step + 1)}>
              {isFirst ? 'Get Started' : 'Next'} <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

function WelcomeStep() {
  return (
    <div className="onboarding-welcome">
      <div className="onboarding-hero-icon"><Clapperboard size={34} /></div>
      <h2>Welcome to Sky Movie</h2>
      <p className="onboarding-lead">
        Your local-first cinema library. Scan folders on your machine, enrich them with
        metadata, and play anything — all without accounts or the cloud.
      </p>
      <div className="onboarding-highlights">
        <span><Sparkles size={14} /> Automatic library scanning</span>
        <span><Play size={14} /> Plays every format via mpv</span>
        <span><Heart size={14} /> Favorites, playlists & resume</span>
      </div>
      <p className="onboarding-note">This quick tour takes under a minute. You can skip it any time.</p>
    </div>
  );
}

function MediaSetupStep({
  libraryFolders, busy, scanRequested, onToggleScan, onChooseFolders, onRemoveFolder
}: {
  libraryFolders: string[];
  busy: boolean;
  scanRequested: boolean;
  onToggleScan(v: boolean): void;
  onChooseFolders(): void;
  onRemoveFolder(path: string): void;
}) {
  return (
    <div className="onboarding-step">
      <div className="onboarding-step-head">
        <h2>Set Up Your Media Library</h2>
        <p>Add the folders where your movies and shows live. Sky Movie scans them and builds your library automatically.</p>
      </div>

      <button className="onboarding-add-folder" onClick={onChooseFolders} disabled={busy}>
        <FolderPlus size={18} /> Add media folder
      </button>

      {libraryFolders.length > 0 ? (
        <ul className="onboarding-folder-list">
          {libraryFolders.map((folder) => (
            <li key={folder}>
              <span className="onboarding-folder-path" title={folder}>{folder}</span>
              <button className="onboarding-folder-remove" onClick={() => onRemoveFolder(folder)} title="Remove folder" aria-label="Remove folder">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="onboarding-empty-hint">No folders added yet — you can also do this later from Settings.</p>
      )}

      <label className="onboarding-scan-toggle">
        <Switch checked={scanRequested} onChange={onToggleScan} label="Scan my library now when I finish the tour" />
      </label>
      <p className="onboarding-note"><ScanLine size={13} /> Scanning runs in the background so you can keep using the app.</p>
    </div>
  );
}

function PlayerConfigStep({ settings, onSave }: { settings: AppSettings; onSave(u: Partial<AppSettings>): void }) {
  return (
    <div className="onboarding-step">
      <div className="onboarding-step-head">
        <h2>Player Configuration</h2>
        <p>Set your playback defaults. You can change any of these later in Settings.</p>
      </div>

      <div className="onboarding-config-list">
        <div className="onboarding-config-row">
          <div className="onboarding-config-label">
            <Cpu size={16} />
            <div>
              <strong>Hardware acceleration</strong>
              <small>Use the GPU to decode video and save battery.</small>
            </div>
          </div>
          <Switch
            checked={settings.hardwareAcceleration}
            onChange={(v) => onSave({ hardwareAcceleration: v })}
            label=""
          />
        </div>

        <div className="onboarding-config-row">
          <div className="onboarding-config-label">
            <Volume2 size={16} />
            <div>
              <strong>Preferred audio language</strong>
              <small>Pick this track automatically when available.</small>
            </div>
          </div>
          <GlassSelect
            options={LANGUAGE_OPTIONS}
            value={settings.preferredAudioLanguage}
            onChange={(v) => onSave({ preferredAudioLanguage: v })}
            ariaLabel="Preferred audio language"
            size="sm"
          />
        </div>

        <div className="onboarding-config-row">
          <div className="onboarding-config-label">
            <Captions size={16} />
            <div>
              <strong>Preferred subtitle language</strong>
              <small>Turn on matching subtitles automatically.</small>
            </div>
          </div>
          <GlassSelect
            options={LANGUAGE_OPTIONS}
            value={settings.preferredSubtitleLanguage}
            onChange={(v) => onSave({ preferredSubtitleLanguage: v })}
            ariaLabel="Preferred subtitle language"
            size="sm"
          />
        </div>

        <div className="onboarding-config-row">
          <div className="onboarding-config-label">
            <History size={16} />
            <div>
              <strong>Resume playback</strong>
              <small>Continue from where you stopped watching.</small>
            </div>
          </div>
          <Switch
            checked={settings.resumePlayback}
            onChange={(v) => onSave({ resumePlayback: v })}
            label=""
          />
        </div>

        <div className="onboarding-config-row">
          <div className="onboarding-config-label">
            <Play size={16} />
            <div>
              <strong>Auto-play next episode</strong>
              <small>Roll into the next episode when one finishes.</small>
            </div>
          </div>
          <Switch
            checked={settings.autoPlayNextEpisode}
            onChange={(v) => onSave({ autoPlayNextEpisode: v })}
            label=""
          />
        </div>
      </div>
    </div>
  );
}

function FeatureGridStep({ title, subtitle, features }: {
  title: string;
  subtitle: string;
  features: { icon: React.ReactNode; title: string; desc: string }[];
}) {
  return (
    <div className="onboarding-step">
      <div className="onboarding-step-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="onboarding-feature-grid">
        {features.map((f) => (
          <div key={f.title} className="onboarding-feature-card">
            <span className="onboarding-feature-icon">{f.icon}</span>
            <div>
              <strong>{f.title}</strong>
              <small>{f.desc}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinishStep() {
  return (
    <div className="onboarding-welcome">
      <div className="onboarding-hero-icon onboarding-hero-icon--done"><Check size={34} /></div>
      <h2>You're all set</h2>
      <p className="onboarding-lead">
        Your library is ready. Jump in and start watching — and remember you can relaunch
        this tour any time from <strong>Settings → Help → Welcome Tour</strong>.
      </p>
      <p className="onboarding-note"><Keyboard size={13} /> Tip: press Ctrl+/ to see every keyboard shortcut.</p>
    </div>
  );
}
