---
name: Sky Movie
colors:
  surface: '#111317'
  surface-dim: '#111317'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#bec8d2'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#88929b'
  outline-variant: '#3e4850'
  surface-tint: '#89ceff'
  primary: '#89ceff'
  on-primary: '#00344d'
  primary-container: '#0ea5e9'
  on-primary-container: '#003751'
  inverse-primary: '#006591'
  secondary: '#c4c6ce'
  on-secondary: '#2d3037'
  secondary-container: '#464950'
  on-secondary-container: '#b6b8c0'
  tertiary: '#c3c6d2'
  on-tertiary: '#2c303a'
  tertiary-container: '#989ba6'
  on-tertiary-container: '#2f333c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c9e6ff'
  primary-fixed-dim: '#89ceff'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#004c6e'
  secondary-fixed: '#e1e2ea'
  secondary-fixed-dim: '#c4c6ce'
  on-secondary-fixed: '#191c22'
  on-secondary-fixed-variant: '#44474d'
  tertiary-fixed: '#dfe2ee'
  tertiary-fixed-dim: '#c3c6d2'
  on-tertiary-fixed: '#181c24'
  on-tertiary-fixed-variant: '#434750'
  background: '#111317'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 280px
  grid-gutter: 24px
  container-padding: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system for this movie library app is anchored in a **Cinematic Modernism** aesthetic. It prioritizes the visual impact of high-fidelity film posters by utilizing a deep, immersive color palette and generous negative space. The brand personality is premium, focused, and sophisticated, evoking the feeling of a private home theater interface rather than a busy commercial storefront.

The style combines **Glassmorphism** for navigational overlays with a **Minimalist** layout structure. This creates a clear hierarchy where the interface recedes to allow the media content to take center stage. The emotional response is one of calm exploration and high-quality curation.

## Colors
The palette is built on a foundation of deep, layered dark tones to maximize screen contrast and visual depth.

- **Primary Background (#0F1115):** A deep charcoal "true neutral" used for the main application canvas to ensure movie posters pop.
- **Surface/Secondary (#1A1D23):** Used for elevated surfaces like sidebars or card backgrounds to provide subtle structural separation.
- **Accent (#0EA5E9):** A vibrant Sky Blue used sparingly for interactive states, progress bars, and high-priority indicators.
- **Typography:** Pure white is reserved for headers and active states, while a muted slate-gray is used for metadata and secondary labels to reduce eye strain.

## Typography
The typography system uses a dual-font approach to balance personality with utility.

- **Headlines:** **Plus Jakarta Sans** provides a modern, slightly rounded, and premium feel for movie titles and section headers. Its geometric nature feels optimistic and clean.
- **Body & Labels:** **Inter** is used for all functional UI elements, descriptions, and metadata. Its high legibility and neutral character ensure that dense information (like cast lists or synopses) remains readable.
- **Hierarchy:** Use tight letter-spacing on large display titles for a "poster-like" editorial look. Use uppercase tracking for small labels (e.g., GENRE, RATING) to differentiate them from body text.

## Layout & Spacing
This design system utilizes a **Fixed Sidebar + Fluid Grid** model. 

- **Navigation:** A persistent 280px left sidebar handles primary navigation. On smaller viewports, this may collapse into a condensed icon-only rail.
- **Content Grid:** The movie library uses a responsive CSS Grid with a minimum item width of 200px. Gutters are fixed at 24px to provide "breathing room" between high-contrast artwork.
- **Safe Areas:** Main content views feature a 40px internal padding to maintain a cinematic wide-screen feel.
- **Vertical Rhythm:** Elements within a card (title, year, rating) follow an 8px (sm) increment, while distinct sections on a detail page follow a 32px (lg) increment.

## Elevation & Depth
Depth is established through **Tonal Layering** and **Glassmorphism** rather than traditional heavy shadows.

- **Level 0 (Background):** The deepest #0F1115 layer.
- **Level 1 (Panels):** Sidebars and modals use a semi-transparent #1A1D23 with a 20px backdrop blur (Glassmorphism). This allows the colors of the movie posters to subtly bleed through the UI, creating a sense of environment.
- **Level 2 (Interactive):** Hovered movie cards scale slightly (1.05x) and gain a soft, sky-blue ambient outer glow (15% opacity) to indicate focus. 
- **Outlines:** Use 1px borders of #FFFFFF (10% opacity) for all containers and buttons to maintain crisp edges without adding visual weight.

## Shapes
The shape language is "Restrained Rounded." 

- **Base Radius:** 8px is the standard for cards and input fields.
- **Large Radius:** 16px (rounded-lg) is used for main container areas or featured hero sections.
- **Strictness:** Do not use fully pill-shaped buttons; maintain the 8px radius to keep the interface feeling architectural and "pro-sumer" rather than playful.

## Components
- **Buttons:** 
  - *Primary:* Solid Sky Blue with white text. 
  - *Secondary:* Outlined (1px white @ 20% opacity) with a hover fill state.
- **Movie Cards:** Poster-first. Titles appear only on hover or in a small label below. Aspect ratio is strictly 2:3.
- **Metadata Chips:** Small, dark-grey capsules (#272B34) with Inter Bold 12px text. Used for "4K", "HDR", or "PG-13".
- **Sidebars:** Matte finish with a 1px right-border divider. Active states are indicated by a vertical Sky Blue "pill" indicator on the left edge.
- **Search Bar:** Subtle #1A1D23 background, inset icon, and an 8px radius. On focus, the border transitions to Sky Blue.
- **Progress Bars:** Thin 4px height. The background is #272B34, and the fill is Sky Blue, used primarily for "Resume Watching" indicators on posters.