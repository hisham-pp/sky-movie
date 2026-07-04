import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

/**
 * Colors map straight onto the CSS variables defined in styles/themes.css.
 * The variables hold complete color values (hex / rgba / color-mix), themed
 * per .app-shell[data-theme], so they are passed through raw — NOT wrapped in
 * hsl(). One trade-off: opacity modifiers like bg-primary/50 can't work with
 * full-color variables; use the dedicated translucent tokens (glass, panel)
 * or a one-off arbitrary value instead.
 */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          deep: 'var(--bg-deep)'
        },
        surface: {
          lowest: 'var(--surface-lowest)',
          low: 'var(--surface-low)',
          DEFAULT: 'var(--surface)',
          high: 'var(--surface-high)',
          highest: 'var(--surface-highest)'
        },
        ink: 'var(--ink)',
        soft: 'var(--soft)',
        muted: 'var(--muted)',
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)'
        },
        primary: {
          DEFAULT: 'var(--primary)',
          strong: 'var(--primary-strong)'
        },
        'on-primary': 'var(--on-primary)',
        danger: 'var(--danger)',
        gold: 'var(--gold)',
        panel: {
          DEFAULT: 'var(--panel)',
          solid: 'var(--panel-solid)'
        },
        glass: {
          DEFAULT: 'var(--glass-bg)',
          strong: 'var(--glass-bg-strong)',
          border: 'var(--glass-border)'
        }
      },
      boxShadow: {
        glow: 'var(--glow)',
        panel: 'var(--shadow)',
        glass: 'var(--glass-shine)'
      },
      transitionTimingFunction: {
        fluid: 'var(--ease-fluid)',
        spring: 'var(--ease-spring)'
      }
    }
  },
  plugins: [
    // backdrop-glass / backdrop-glass-light — Tailwind's backdrop-blur-* can't
    // express the combined blur()+saturate() filter the glass tokens use.
    plugin(({ addUtilities }) => {
      addUtilities({
        '.backdrop-glass': { 'backdrop-filter': 'var(--glass-blur)' },
        '.backdrop-glass-light': { 'backdrop-filter': 'var(--glass-blur-light)' }
      });
    })
  ]
} satisfies Config;
