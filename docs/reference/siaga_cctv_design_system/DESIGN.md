---
name: SIAGA-CCTV Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#43474f'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#001855'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b2c7d'
  on-tertiary-container: '#8098ed'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#dce1ff'
  tertiary-fixed-dim: '#b6c4ff'
  on-tertiary-fixed: '#00164e'
  on-tertiary-fixed-variant: '#264191'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  status-on-base: '#16A34A'
  status-on-surface: '#F0FDF4'
  status-on-border: '#86EFAC'
  status-off-base: '#DC2626'
  status-off-surface: '#FEF2F2'
  status-off-border: '#FCA5A5'
  status-warning-base: '#D97706'
  status-warning-surface: '#FFFBEB'
  status-warning-border: '#FDE68A'
  status-pending-base: '#64748B'
  status-pending-surface: '#F8FAFC'
  status-pending-border: '#CBD5E1'
  canvas-base: '#F8FAFC'
  canvas-subtle: '#F1F5F9'
  surface-card: '#FFFFFF'
  border-grid: '#E2E8F0'
  text-main: '#0F172A'
  text-muted: '#64748B'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  data-mono:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

### Personality & Direction
This design system defines an industrial, high-integrity enterprise telemetry and monitoring aesthetic designed for critical operational surveillance. The personality is disciplined, authoritative, precise, and utilitarian. It strips away extraneous visual decoration to deliver maximum cognitive clarity and rapid situational awareness for terminal officers and central supervisors.

### Target Audience & Operational Mindset
1. **Field Station Operators (`PETUGAS`):** Working in operational environments (AFT, IT, LPG, FT depots) on smartphones or standard desktop terminals. They require tactile, high-speed batch input forms that allow immediate status declaration without friction.
2. **Operations Supervisors & Regional Admins (`ADMIN`):** Monitoring cross-depot compliance metrics, investigating system anomalies, exporting audit-ready reports, and copying daily executive briefings. They require condensed, high-density data tables and unambiguous visual alerts.

### Design Movement: Modern Industrial Enterprise
The design merges modern enterprise utility with mission-critical monitoring conventions:
- **Clean Functionalism:** Structural 1px division borders instead of heavy drop shadows, purposeful semantic badges, and predictable grid alignments.
- **High-Velocity Ergonomics:** Primary operational paths (e.g., "Pilih Semua ON", status segment toggles) are prioritized with tactile, high-contrast visual affordances.
- **Information Density:** Compact padding, monospaced tabular figures, and categorical indicators that preserve vertical space while keeping data scannable under harsh lighting conditions.

## Colors

### Color Strategy & Hierarchy
The palette uses high-contrast navy enterprise anchors balanced against standard telemetric status accents.

- **Primary (`#003366` - Enterprise Navy):** Serves as the authoritative brand anchor used for global navigation bars, top-level headings, primary bulk actions, and active states.
- **Secondary (`#0F172A` - Slate Black):** Applied for high-contrast typography, data values, table headers, and structural UI elements.
- **Tertiary (`#1E3A8A` - Industrial Cobalt):** Used for interactive link states, focus rings, and secondary control indicators.
- **Neutral (`#64748B` - Slate Neutral):** Manages secondary metadata, table borders, neutral metric states, and placeholder indications.

### Operational Semantic Tokens
Telemetry indicators must remain strictly distinct and non-negotiable:
- **Status ON / Normal (`status-on-base`: `#16A34A` | `status-on-surface`: `#F0FDF4`):** Confirms all cameras are fully functional. Pair with `#15803D` for text labels on light backgrounds to preserve WCAG AAA compliance.
- **Status Kendala / OFF (`status-off-base`: `#DC2626` | `status-off-surface`: `#FEF2F2`):** Highlights operational defects. Requires immediate attention; pairs with bold badge outlines (`#FCA5A5`).
- **Status Warning / Attention (`status-warning-base`: `#D97706` | `status-warning-surface`: `#FFFBEB`):** Warns of partial anomalies, pending syncs, or nearing submission cut-offs.
- **Status Belum Lapor / Unreported (`status-pending-base`: `#64748B` | `status-pending-surface`: `#F8FAFC`):** Indicates missing station submissions for the active calendar date.

## Typography

### Structural Pairings
- **Headings & Key Metrics (`Plus Jakarta Sans`):** Delivers clean geometry, crisp apertures, and balanced letterforms. It ensures large numbers in KPI summary blocks stand out with immediate legibility.
- **Body, Table Data & Microcopy (`Inter`):** Selected for its tall x-height, clear numeric distinctions, and superior density rendering inside data grids.

### Tabular Formatting
All numeric reporting, timestamps, count metrics, and station category badges must apply tabular figures (`font-feature-settings: 'tnum' 1, 'cv05' 1`). This prevents vertical alignment shifts when numbers update in live tables and status bars.

## Layout & Spacing

### Layout Structure
The system uses a 12-column responsive fluid grid designed for rapid scanning. 
- **Desktop (>= 1280px):** 12 columns with `1.5rem` gutters and `2rem` outer page margins. Dashboard widgets and batch rows utilize the wide viewport to align locations, toggle switches, and input notes horizontally.
- **Tablet (768px - 1279px):** 8 columns with `1rem` gutters and `1.5rem` margins. KPI metric cards wrap into a 2x2 grid.
- **Mobile (< 768px):** 4 columns with `0.75rem` gutters and `1rem` margins. The batch input rows transform from horizontal grid bars into vertical location cards with full-width action toggles.

### Spacing Scale & Density
- **Micro Spacing (`0.25rem` - `0.5rem`):** Reserved for badge paddings, button icon gaps, and input field internal spacing.
- **Component Spacing (`0.75rem` - `1rem`):** Used for table row vertical padding, form input field gaps, and card content separators.
- **Section Spacing (`1.5rem` - `2rem`):** Separates KPI metric clusters, data tables, and batch form action headers.

## Elevation & Depth

### Structural Philosophy
The visual hierarchy avoids heavy dropped shadows and blur-heavy glassmorphism. It uses low-contrast 1px outlines (`#E2E8F0`) and subtle, tinted surface offsets (`#F8FAFC` vs `#FFFFFF`) to maintain an industrial, print-ready aesthetic that feels responsive and sharp.

### Elevation Levels
- **Level 0 (Flat Canvas - `#F8FAFC`):** The global application backdrop.
- **Level 1 (Card & Table Surface - `#FFFFFF`):** Base card surfaces, table containers, and filter bars. Contained with a solid border (`1px solid #E2E8F0`) and an ambient, low-spread resting shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`.
- **Level 2 (Hover & Active Panels):** Interactive cards, active batch row highlights, and expanded dropdowns. Border intensifies to `#CBD5E1` with shadow `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modals & Sticky Action Bars):** Fixed bottom batch submit bars, dialog overlays, and export preview drawers. Shadow: `0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -4px rgba(15, 23, 42, 0.06)`.

## Shapes

### Edge Treatment
The system uses a soft industrial radius (`roundedness: 1`):
- **Base Components (Inputs, Buttons, Badges):** `4px` (`0.25rem`). This produces crisp, mechanical corners suited for administrative density.
- **Cards & Data Tables:** `8px` (`0.5rem`) outer container borders, preventing harsh box intersections while preserving structured data flow.
- **Status Pills & Chips:** `4px` (`0.25rem`) with 1px border frames. Full pill roundings (9999px) are strictly prohibited except for counter dots, ensuring the interface maintains its professional enterprise posture.

## Components

### 1. KPI Metric Summary Cards
- **Structure:** 4-card metric grid atop the supervisor dashboard (Total Lokasi Aktif, Sudah Lapor - ON, Ada Kendala / OFF, Belum Lapor).
- **Styling:** White surface, `1px solid #E2E8F0` border, `p-4` spacing.
- **Accents:** A `3px` colored top border indicates metric status (e.g., `#16A34A` for ON, `#DC2626` for OFF, `#64748B` for Belum Lapor).
- **Data Display:** Metric label in `label-sm` (`#64748B`), large stat in `headline-xl` (`#0F172A`), with a secondary badge indicating percentage or delta.

### 2. Multi-Location Batch Input Row (Petugas Form)
- **Container:** Segmented white card or banded table row with subtle hover reaction.
- **Location Tag:** Category prefix (`IT`, `FT`, `LPG`) in a high-contrast monospaced chip (`bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded`), followed by location name in `headline-sm`.
- **Segmented Action Buttons:**
  - **Button ON:** Green highlight (`bg-emerald-600 text-white font-medium`) when selected; neutral border (`border-slate-300 text-slate-700 bg-white`) when inactive.
  - **Button Ada Kendala / OFF:** Red highlight (`bg-rose-600 text-white font-medium`) when selected; neutral border when inactive.
- **Conditional Notes Input:** When "Ada Kendala / OFF" is activated, a text input field smoothly expands inline with placeholder: `"Tulis kendala (opsional, contoh: Off 3 titik kamera)"`.

### 3. Bulk Quick-Action Bar
- **Positioning:** Pinned above the batch input form.
- **"Pilih Semua ON" Shortcut:** Distinct secondary outline button (`border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold px-4 py-2`). Allows 1-click default population for all locations.
- **Batch Submit Button:** Primary Navy button (`bg-[#003366] text-white hover:bg-[#002244] shadow-sm px-6 py-2.5 font-semibold text-sm`).

### 4. Data-Dense Tables (Rekapitulasi & Master Data)
- **Header:** Sticky header with `#F8FAFC` background, uppercase `caption` typography (`#475569`), bottom border `2px solid #E2E8F0`.
- **Row Styling:** Row height `40px` compact / `48px` standard. Border bottom `1px solid #F1F5F9`. Alternating row shading is avoided in favor of crisp horizontal borders.
- **Status Cells:** Status badges use solid background fills with contrasting text:
  - `ON`: `bg-emerald-50 text-emerald-700 border border-emerald-200`
  - `OFF`: `bg-rose-50 text-rose-700 border border-rose-200`
  - `BELUM LAPOR`: `bg-slate-100 text-slate-600 border border-slate-200`

### 5. WhatsApp Text Copy Drawer / Modal
- **Display Box:** Monospaced code box (`bg-slate-900 text-emerald-400 p-4 rounded text-xs font-mono whitespace-pre line-height-relaxed select-all`).
- **Copy Trigger Button:** Primary button with copy icon (`bg-emerald-600 hover:bg-emerald-700 text-white font-medium`) showing feedback on click (`"Tersalin ke Clipboard!"`).

### 6. Form Inputs & Filter Controls
- **Inputs:** `36px` height, `border-slate-300`, background `white`, focus state `ring-2 ring-[#003366]/20 border-[#003366]`.
- **Date Range Presets:** Segmented button group (`Hari Ini`, `Minggu Ini`, `Bulan Ini`) with `text-xs font-medium` for quick filtering without opening calendar popovers.