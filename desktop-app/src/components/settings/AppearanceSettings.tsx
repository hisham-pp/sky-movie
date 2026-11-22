'use client';

import { memo } from 'react';
import { Palette } from 'lucide-react';
import type { AppTheme, PlayerStyle } from '@/types';
import { Switch } from '../common';
import { useLibraryControllerContext } from '@/hooks/LibraryControllerContext';

export const themePresets: Array<{
  id: AppTheme;
  name: string;
  description: string;
  swatches: [string, string, string];
}> = [
  {
    id: 'pitch-black',
    name: 'Pitch Black',
    description: 'Pure OLED black canvas with royal violet accents.',
    swatches: ['#000000', '#0a0a0c', '#7c6eed']
  },
  { id: 'cinema', name: 'Cinema', description: 'Cinematic charcoal surfaces with sky blue focus.', swatches: ['#111317', '#1a1c20', '#89ceff'] },
  { id: 'midnight', name: 'Midnight', description: 'Deep blue surfaces with soft violet accents.', swatches: ['#070b18', '#8bb7ff', '#b695ff'] },
  { id: 'daylight', name: 'Daylight', description: 'Clean bright layout for daytime curation.', swatches: ['#f7f3ea', '#2364d2', '#111317'] },
  { id: 'ember', name: 'Ember', description: 'Warm theater tones with amber focus states.', swatches: ['#170b08', '#ffb13c', '#f04f32'] },
  { id: 'ocean', name: 'Ocean', description: 'Deep teal waves with aqua highlights.', swatches: ['#0a1a1f', '#14b8a6', '#06b6d4'] },
  { id: 'forest', name: 'Forest', description: 'Rich emerald tones with natural greens.', swatches: ['#0f1810', '#10b981', '#34d399'] },
  { id: 'sunset', name: 'Sunset', description: 'Warm dusk palette with golden accents.', swatches: ['#1a1214', '#f59e0b', '#fb923c'] },
  { id: 'noir', name: 'Noir', description: 'Pure black surfaces with minimal accents.', swatches: ['#000000', '#404040', '#a3a3a3'] },
  { id: 'lavender', name: 'Lavender', description: 'Soft purple hues with dreamy atmospherics.', swatches: ['#1a0f1f', '#a78bfa', '#c4b5fd'] },
  { id: 'crimson', name: 'Crimson', description: 'Bold red theater with dramatic contrast.', swatches: ['#1a0808', '#ef4444', '#dc2626'] },
];

export const playerStylePresets: Array<{ id: PlayerStyle; name: string; description: string }> = [
  { id: 'default', name: 'Default', description: 'Standard controls with seek bar, volume, track selection and fullscreen toggle.' },
  { id: 'youtube', name: 'YouTube', description: 'Familiar YouTube-style red progress bar with nested settings panel.' },
];

export const AppearanceSettings = memo(function AppearanceSettings() {
  const { settings, saveSettings } = useLibraryControllerContext();
  const activeTheme = settings?.theme ?? (typeof window !== 'undefined' ? (localStorage.getItem('sky-movie:theme') as AppTheme | null) : null) ?? 'pitch-black';
  const activePlayerStyle = settings?.playerStyle ?? 'youtube';

  return (
    <div className="settings-sections">
      <div className="settings-section">
        <div className="settings-section-heading">
          <div>
            <h3>Theme</h3>
            <p>Pick a built-in look for the whole desktop app.</p>
          </div>
        </div>
        <div className="theme-grid">
          {themePresets.map((theme) => (
            <button
              key={theme.id}
              className={`theme-card${activeTheme === theme.id ? ' active' : ''}`}
              onClick={() => saveSettings({ theme: theme.id })}
              aria-pressed={activeTheme === theme.id}
            >
              <span className="theme-preview" aria-hidden="true">
                {theme.swatches.map((swatch) => (
                  <span key={swatch} style={{ background: swatch }} />
                ))}
              </span>
              <span>
                <strong><Palette size={16} />{theme.name}</strong>
                <small>{theme.description}</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-heading">
          <div>
            <h3>Layout</h3>
            <p>Control which UI elements are visible.</p>
          </div>
        </div>
        <div className="settings-form-grid">
          <Switch
            id="setting-hide-sidebar"
            label="Hide sidebar"
            checked={settings?.hideSidebar ?? false}
            onChange={(checked) => saveSettings({ hideSidebar: checked })}
          />
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-heading">
          <div>
            <h3>Player</h3>
            <p>Choose which player engine to use for local media.</p>
          </div>
        </div>
        <div className="player-style-grid">
          {playerStylePresets.map((style) => (
            <button
              key={style.id}
              className={`player-style-card${activePlayerStyle === style.id ? ' active' : ''}`}
              onClick={() => saveSettings({ playerStyle: style.id })}
              aria-pressed={activePlayerStyle === style.id}
            >
              <strong>{style.name}</strong>
              <small>{style.description}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
