---
name: CareerCompass Intelligence
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#00524b'
  on-tertiary: '#ffffff'
  tertiary-container: '#006c63'
  on-tertiary-container: '#81eddf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.5rem
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  title-md:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '500'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: -0.005em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
  code-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies an architectural, precision-driven productivity aesthetic tailored for ambitious students navigating modern career trajectories. Borrowing foundational sensibilities from high-performance workflows like Linear and refined modern EdTech platforms, the interface balances cognitive clarity with institutional prestige.

The visual direction centers on:
- **Calibrated Restraint:** High density of actionable intelligence without visual clutter. The system uses subtle surface stratification and hyper-disciplined borders to structure information.
- **Empowering Authority:** Deep slate-navy typography gives data readouts, diagnostic rubrics, and roadmaps an authoritative, calm presence.
- **Optimistic Precision:** Sharp, deliberate hits of high-chroma indigo drive primary user progression, complemented by analytical emerald and teal indicators to celebrate alignment, growth metrics, and skill matches.

## Colors

The palette is tuned specifically for sustained desktop focus, data analysis, and confident forward motion.

- **Canvas & Card Base:** Root canvas settles on a warm, fatigue-reducing off-white (`#F8FAFC`). Active workspaces, elevated panels, and metric modules leverage crisp, pure white (`#FFFFFF`) to pop with dimensional purity.
- **Primary Brand (Action & Focus):** Vibrant Indigo (`#4F46E5`) serves as the core interactive engine, shifting to deep indigo (`#4338CA`) on hover/active states. Soft lavender tints (`#EEF2FF`) form low-friction interaction containers and selected tab states.
- **Secondary & Tertiary (Metrics & Affirmation):** Emerald (`#059669`) and Teal (`#0D9488`) signal compatibility scores, market-readiness percentages, and verified milestones. Paired with soft mint washes (`#ECFDF5`), these communicate progress without alarm.
- **Neutrals & Typographic Hierarchy:** Deepest navy (`#0F172A`) commands high-contrast headlines and critical metric numbers. Secondary body layers utilize balanced slate (`#1E293B`, `#475569`), grounded by structural division borders (`#E2E8F0`) and neutral hover fills (`#F1F5F9`).

## Typography

The type hierarchy relies entirely on **Inter**, tuned through tight tracking, systematic optical balance, and deliberate proportional scale.

- **Headlines & Metric Data:** Uses negative letter spacing (`-0.025em` to `-0.015em`) with semi-bold to bold weights to mimic surgical data tooling. Large quantitative scores leverage tabular figures (`tnum`) for vertical scanning.
- **Body & Editorial Content:** Balanced line heights ensure readability across dynamic AI career summaries, interview feedback scripts, and course outlines.
- **Labels & Micro-data:** Micro-copy (`label-sm`, `code-sm`) introduces slightly expanded positive letter spacing (`0.02em` to `0.04em`) with medium to semi-bold weights for categorization chips, career badges, and verification tags.

## Layout & Spacing

The system prioritizes a **desktop-first 1440px viewport** built around an integrated application chassis:

- **Chassis Structure:**
  - Fixed left sidebar at `240px` for top-level navigation, account context, and diagnostic state.
  - Flexible main canvas running fluidly up to a maximum container constraint of `1200px` within the workspace view.
  - Optional contextual right inspector rail (`320px`) for live AI insights and telemetry.
- **Grid & Alignment:**
  - 12-column responsive fluid grid inside the main canvas using `1.5rem` (`24px`) gutters.
  - Consistent canvas padding rhythm anchored at `2rem` (`32px`) margins on desktop, downshifting to `1rem` (`16px`) margins with an 8-column layout on tablet (`768px - 1024px`) and a 4-column single-stream reflow on mobile (`<768px`).
- **Vertical Rhythm:** 
  - Components, card grids, and section dividers step rigorously across `0.5rem` (`8px`) increments.

## Elevation & Depth

Visual stratification uses delicate multi-stop ambient shadows paired with low-contrast borders (`#E2E8F0`). Flat planes are separated by hue variation rather than heavy elevation.

- **Level 0 (Base Canvas):** Flat `#F8FAFC`. No shadow.
- **Level 1 (Card & Section Containers):** Solid `#FFFFFF` fill with a crisp `1px` solid `#E2E8F0` border and an ambient micro-shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Dropdowns, Floating Toolbars, Active States):** Solid `#FFFFFF` with `1px` border (`#CBD5E1`) and moderate ambient depth: `0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modals, Command Palettes, Spotlight Overlays):** Supported by a subtle backdrop blur (`backdrop-blur-md` with `rgba(15, 23, 42, 0.4)` scrim) and high-spread shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)`.

## Shapes

The design system implements a **Rounded (Level 2)** geometry to balance modern enterprise software discipline with approachable student utility.

- Standard buttons, form controls, and nested list items adopt `0.5rem` (`8px`).
- Major cards, analytical modules, and data preview panels scale to `rounded-lg` (`1rem` / `16px`).
- Floating system dialogs, banner takeovers, and large hero modules leverage `rounded-xl` (`1.5rem` / `24px`).
- Status dots, user avatars, pill badges, and quick-filter chips utilize fully rounded capsules (`9999px`).

## Components

### Buttons
- **Primary:** High-chroma `#4F46E5` background, `#FFFFFF` text, `0.5rem` radius. Hover state darkens smoothly to `#4338CA` with subtle translation (`transform: translateY(-0.5px)`). Focus ring applies `2px` offset with `rgba(79, 70, 229, 0.35)`.
- **Secondary:** Clean `#FFFFFF` fill, `#0F172A` text, bordered with `#E2E8F0`. Hover triggers background tint `#F8FAFC` and border `#CBD5E1`.
- **Ghost/Tertiary:** No border, transparent background, `#475569` text. Hover shifts to `#EEF2FF` with `#4F46E5` text.

### Match & Skill Chips
- **High Compatibility Chip:** Pill-shaped, `#ECFDF5` background, `1px` border in `#A7F3D0`, text in `#059669`. Includes a `6px` solid emerald circle indicator preceding the label.
- **Exploratory Chip:** Light lavender `#EEF2FF` fill, `#C7D2FE` border, `#4338CA` text.

### Cards & Modules
- Structured on `#FFFFFF` surfaces with `1px` solid `#E2E8F0` border and Level 1 elevation.
- Internal headers split cleanly with an optional subtle horizontal border (`#F1F5F9`). Interactive cards support a hover transition that adjusts the border to `#C7D2FE` and elevates shadow smoothly to Level 2.

### Form Inputs & Selectors
- Height locked at `40px` (desktop) with `0.5rem` corner radius. `#FFFFFF` background with crisp `1px` border in `#E2E8F0`.
- Text styled in `body-md` with `#0F172A`. Placeholder in `#94A3B8`.
- Focus ring: single active outline in `#4F46E5` with `3px` outer aura in `#EEF2FF`.

### Checkboxes & Radios
- Crisp `16px x 16px` squared inputs with `4px` radius (checkbox) or circular boundary (radio).
- Default border `#CBD5E1`, filling on `:checked` to `#4F46E5` with a high-contrast white checkmark icon.

### Analytical Score Displays (Product-Specific)
- Dual-metric radar cards displaying percentile progress bars (`6px` track height, `#E2E8F0` background, `#059669` or `#4F46E5` fill).
- Circular radial match rings paired with bold tabular score values (`title-md` or `headline-sm`).