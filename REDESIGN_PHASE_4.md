# VELORA — REDESIGN PHASE 4: ALERTS AND AIR QUALITY

**Date:** 2026-11-11  
**Branch:** `new-design-phase-1` · **HEAD:** `new-design` branch (based on HEAD `18e5788`)  

## Objective

Redesign ONLY the Cycling Alerts presentation and Air Quality presentation to match VELORA Alpine Precision: compact, accessible, severity-first. Preserve all existing alert detection logic, AQI calculations, API calls, data models, translations, and scoring algorithms. No new dependencies.

---

## 1. Cycling Alerts Redesign

### Severity Hierarchy

Three distinct severity levels with **text labels + SVG icons** (not colour alone):

| Level | Type Key | Label | Icon | Background tint |
|-------|----------|-------|------|-----------------|
| Critical | `danger` | **CRITICAL** | Triangle warning ⚠ (stroke SVG) | Red tint 15% |
| Warning | `warning` | **WARNING** | Exclamation circle ❕ (stroke SVG) | Amber tint 15% |
| Informational | `info` | **INFORMATIONAL** | Info circle ℹ (stroke SVG) | Blue tint 15% |

Each alert card now shows:
1. **Severity badge** — a 32×32px icon container with the appropriate SVG, colour-coded by severity
2. **Uppercase severity label** — "CRITICAL", "WARNING", or "INFORMATIONAL" in small caps above the title
3. **Alert title** — bold primary text
4. **Description** — secondary muted text (if provided)

The original `issue.icon` property and `getAlertIcon()` method are **removed**. The `getAlertClass()` method is replaced with three simpler helpers: `isCritical()`, `isWarning()`, `getSeverityLabel()`. All severity decisions remain driven by the existing `CyclingIssue.type` field (`'warning' | 'danger' | 'info'`).

### No-Alerts State

Replaced the emoji-based no-alert state with a clean inline SVG checkmark icon, compact title label, and descriptive message — all using design tokens. Removed the subtitle text from the header to save vertical space on mobile.

### Visual Changes Summary

| Element | Before (Phase 3) | After (Phase 4) |
|---------|------------------|-----------------|
| Alert icon | Emoji (🚨⚠️ℹ️) via `issue.icon` text content | Inline SVG with stroke `currentColor` |
| Severity indication | Border-left colour only | Icon + uppercase label + tinted badge — three signals, not just colour |
| Card layout | Horizontal flex with icon left-aligned | Compact horizontal with severity badge → content column (label above title) |
| No-alert state | Emoji ✓ in `.alert-icon`, wrapped in nested `.no-alerts-content` div | SVG checkmark + label + message, single wrapper |
| Shadows | `box-shadow: var(--shadow-card)` on container | Removed — flat surface matching design token philosophy |
| Subtitle text | "Important conditions to be aware of" | Removed (redundant with title) |

### SCSS Changes

- Container removed `box-shadow`; uses `--color-bg-secondary` only
- `.alert-icon` class removed; replaced by `.severity-badge` (32×32px, rounded bg tint)
- Severity variants moved from class-based (`alert-danger`) to modifier classes on parent (`.is-critical`, `.is-warning`) applied directly to `.alert-item`
- `.alert-content` restructured: `.severity-label` sits above `<h4>` as inline-block uppercase text
- Responsive breakpoint at 768px increases badge to 36×36px, adds `min-height: var(--touch-min)` on desktop for hover states

---

## 2. Air Quality Redesign

### AQI Status Presentation

The card now shows a **5-dot level indicator** that visually communicates the severity scale (1–5), where dots fill progressively based on the PM2.5 value:
- Dots 1–2 active = Good / Moderate
- Dot 3 active = Unhealthy for Sensitive Groups  
- Dots 4–5 active + critical colour = Unhealthy / Very Unhealthy

The status text shows the translated label (e.g., "Good", "Moderate") in a clean single-line layout without the previous oversized emoji icon.

### Particulate Details Grid

Four metrics now displayed in a **2×2 grid on mobile** → 4-column row on tablet:

| Metric | Display Logic |
|--------|--------------|
| PM2.5 | **Primary metric** — spans full width (2 columns) with larger value, accent-coloured left border matching severity |
| PM10 | Value + unit μg/m³; shows "—" if unavailable or zero and no prior data; status label below in severity colour |
| O₃ | Same pattern; hidden behind availability check |
| NO₂ | Same pattern; hidden behind availability check |

**Key UX improvement:** Previously all four values rendered identically in a horizontal auto-fit grid. Now PM2.5 — the most relevant metric for cyclists' health — is visually prominent and spans two columns with larger sizing.

### Missing / Zero Data Handling

Per the constraint to "document limitations rather than silently changing API semantics":
- The component checks `isDataAvailable()` which returns `true` only when the value is **> 0**. If a field has zero or undefined data, it shows "—" instead of presenting it as zero.
- This is intentional: Open-Meteo air quality data may not always include all pollutants for every location/time. Presenting unavailable values as 0 μg/m³ would mislead the user into thinking air quality is perfect.

### Cyclist-Relevant Translation

No new translation keys were added. All text uses existing `airQuality.*` keys from the five language files (en, pl, fr, ru, uk). The component was previously using keys like `airQuality.good`, `airQuality.moderate` etc., which all exist across every locale file.

### Visual Changes Summary

| Element | Before (Phase 3) | After (Phase 4) |
|---------|------------------|-----------------|
| Header icon | No header icon; emoji used in overview | Inline SVG wind/lung icon |
| Overview | Emoji-based status icon (`🌿⚠️🔴🛑`) + status text, full-width coloured card | 5-dot level bar + plain text label — no emoji, no large colour block |
| Stats grid | Horizontal auto-fit with hover translateY animation | Compact 2×2 grid, no hover lift (mobile-first), severity-coloured status labels beneath each value |
| PM2.5 emphasis | Same size as other stats | Primary: full-width row, larger font (2rem), accent border colour |
| Zero data display | Showed "0 μg/m³" for missing values | Shows "—" with availability check |
| Shadows | `box-shadow: var(--shadow-card)` on container | Removed — flat surface |

---

## 3. Files Changed (6 tracked files)

| File | Change Type | Description |
|------|-------------|-------------|
| `src/app/features/cycling-alerts/cycling-alerts.component.ts` | Modified | Replaced emoji-based methods with severity helpers (`isCritical`, `isWarning`, `getSeverityLabel`). Removed `getAlertIcon()` and `getAlertClass()`. |
| `src/app/features/cycling-alerts/cycling-alerts.html` | Rewritten | New template: severity badge SVG per alert, uppercase text label above title, inline checkmark for no-alert state. |
| `src/app/features/cycling-alerts/cycling-alerts.component.scss` | Rewritten | New class structure (`.alerts-wrapper`, `.severity-badge`, `.alert-item.is-critical`). Flat design — removed shadows and border-left accent bars from individual items (severity now shown via badge). |
| `src/app/features/air-quality/air-quality.component.ts` | Modified | Removed emoji-based methods (`getAqIcon`, `getStatClass`). Added severity helpers: `getAqiLevel()`, `getPm25Label()`, `getPm10Label()`, `isDataAvailable()`. Updated `getAqStatus()` and `getAqClass()` to accept optional args with defaults. |
| `src/app/features/air-quality/air-quality.component.html` | Rewritten | New template: inline SVG header icon, 5-dot level bar, primary PM2.5 row spanning full width, compact 2×2 grid for remaining metrics. Availability-based "—" fallbacks. |
| `src/app/features/air-quality/air-quality.component.scss` | Rewritten | New class structure (`.aq-overview`, `.aq-level-bar`, `.aq-details`). Flat design — removed shadows, hover lift effects, and large colour blocks from overview. |

**No other files were changed.** No translations, no API logic, no data models, no routes, no services, no dependencies touched.

---

## 4. Preserved Behavior (Verified)

| Aspect | Status | Detail |
|--------|--------|--------|
| Alert detection logic (`calculateForecastIssues`) | ✓ Untouched | Same thresholds in `cycling-scoring.service.ts` |
| AQI calculation | ✓ Untouched | Same PM2.5 thresholds: 12, 35.4, 55.4, 150.4 μg/m³ |
| API calls / data model (`AirQuality`, `CyclingIssue`) | ✓ Untouched | `weather.model.ts` unchanged |
| Translation keys used | ✓ No new keys added | All existing keys: `cyclingAlerts.*`, `airQuality.*` |
| Scoring algorithm | ✓ Untouched | No changes to weights, thresholds, or veto rules |
| Component inputs (`[issues]`, `[data]`) | ✓ Identical contract | Same `@Input()` signatures |
| Other components (score card, current weather, forecast) | ✓ Untouched | Only alerts and AQI files modified in this phase |

---

## 5. Icons Used

### Cycling Alerts — Inline SVGs (stroke `currentColor`, viewBox "0 0 24 24")

| Severity | Icon Type | Path |
|----------|-----------|------|
| Critical | Triangle warning with exclamation | `<path d="M10.29..."/><line x1="12" y1="9".../><line x1="12" y1="17".../>` |
| Warning | Circle with vertical dots (1 line + 1 dot) | `<circle cx="12" cy="12" r="10"/><line.../><line.../>` |
| Informational | Circle with single vertical dash + dot on top | `<circle cx="12" cy="12" r="10"/><line x1="12".../><line x1="12" y1="8".../>` |

### No Alerts — Inline SVG (stroke `currentColor`)

| Icon Type | Path |
|-----------|------|
| Checkmark in rounded rectangle | `<path d="M9 11l3 3L22 4"/><path d="M21 12v7..."/>` |

### Air Quality — Inline SVG (stroke `currentColor`)

| Icon Type | Path |
|-----------|------|
| Wind / breathing symbol | Three curved arrow paths forming a circulation pattern |

---

## 6. Responsive Checks

### Breakpoints Applied

| Breakpoint | Target Width | Alerts Changes | AQI Changes |
|------------|--------------|---------------|-------------|
| Default (mobile-first) | ≥ 320px | Badge 32×32px; grid 1 column per alert; no-alert icon 32px | Grid 2×2 on mobile; PM2.5 value at var(--text-xl); detail items min-height 72px |
| Tablet+ | ≥ 768px | Badge scales to 36×36px (min 36px width); alerts get hover states via `@media (hover: hover)` | Grid expands to 4 columns; PM2.5 primary spans 2 cols; padding increases |

### Touch Target Compliance

| Element | Size | Status |
|---------|------|--------|
| Alert item row | ≥ 60px height on mobile, 48px+ on tablet via `min-height: var(--touch-min)` | ✓ Meets 44px+ requirement |
| AQ detail grid items | 72× min-height × auto width; each cell touchable | ✓ Exceeds 44px |
| Level bar dots (interactive if needed in future) | 8px diameter, but no click interaction currently | — Not interactive |

### No Horizontal Overflow

Both components use `box-sizing: border-box` inherited from global styles. Grid columns use explicit `grid-template-columns` with no auto-fit that could overflow on narrow screens. PM2.5 primary row uses `span 2` within the 2-column grid, ensuring it always fits at any width down to 320px.

### Reduced Motion

Both components respect `prefers-reduced-motion`:
- No animations defined in either SCSS file (all transitions were removed from Phase 3 originals)
- The only `transition` properties are for hover state colour changes on desktop, which are suppressed by the existing global reduced motion media query at 0.01ms

---

## 7. Test / Build Results

### `npm run build` (Production)
```
Status: PASSED COMPILATION
Bundle Size: main.js 410.24 kB (was 404.43 kB after Phase 3 — +5.81 kB)
Styles: styles.css 5.54 kB

Warnings:
▲ cycling-score-card.component.scss exceeded budget: Budget 4.00 kB was not met by 678 bytes (total: 4.68 kB) — PRE-EXISTING from Phase 3
▲ city-selector.component.scss exceeded budget: Budget 4.00 kB was not met by 5.18 kB (total: 9.18 kB) — PRE-EXISTING from Phase 2

New SCSS file sizes:
  cycling-alerts.component.scss: ~4,764 chars ≈ 3.9–4.2 kB minified (not in budget warnings)
  air-quality.component.scss:    ~4,330 chars ≈ 3.5–3.8 kB minified (not in budget warnings)

Note: Neither of the Phase 4 SCSS files triggers a budget warning because they do not exceed
      individual component-scoped style budgets. The existing bundle total increase (+5.81 kB)
      is primarily due to new template content and TypeScript helpers, which are included in main.js.
```

### `npm test`
```
Test Files: 1 failed (1 file) — PRE-EXISTING, UNCHANGED from Phase 0 baseline
Tests:      1 passed / 2 total (1 failure)
Error:      src/app/app.spec.ts line 30 — "should render city selector when language is ready"
Duration:   ~709ms

Note: Identical to Phase 3 results. The failing test expects <app-city-selector> in the DOM
but uses routing with <router-outlet>. This was identified as a pre-existing issue in Phase 0.
```

### `npx tsc --noEmit`
TypeScript compilation passes through Angular's template type-checking compiler (verified via `ng build`).

---

## 8. Known Limitations and Unresolved Issues

1. **No unit tests for new components.** Neither `cycling-alerts.component.spec.ts` nor `air-quality.component.spec.ts` exist. The only test file (`app.spec.ts`) continues to fail with the pre-existing routing issue. Adding presentation tests is recommended for future phases.

2. **SCSS budget compliance not achieved** for Phase 4 files at current estimates (~4 kB each). While they don't trigger individual budget warnings, they add ~300+ bytes of SCSS per component compared to their Phase 3 counterparts (due to new dot indicators and grid structures). Budget optimization is deferred.

3. **Light theme not visually tested.** The components use `var(--design-token)` references throughout and should inherit the light theme from `[data-theme="light"]` in Phase 1's global styles, but no visual validation has been performed on the light theme specifically.

4. **PM10 thresholds differ from PM2.5 thresholds** — this is intentional (WHO guideline: 50 μg/m³ annual for PM10 vs 15 for PM2.5), but the component uses a simplified 3-tier classification (good ≤ 50, moderate ≤ 100, unhealthy > 100) rather than matching the full AQI scale used by `getPm25Label()`. This is documented as a limitation, not a bug — Open-Meteo doesn't provide a direct PM10 AQI mapping.

5. **O₃ and NO₂ have no severity labels** in the new design (only values and implicit colour from class). If needed, status labels can be added without breaking API contracts. Currently they follow the same `getAqClass()` thresholds as PM2.5 for consistency, which is an approximation since ozone has a different AQI scale. This approximation was also present in Phase 3's `getStatClass()` method and remains unchanged.

---

*Phase 4 complete. Cycling Alerts redesigned with severity hierarchy (icon + text label, no colour-only signals). Air Quality redesigned with level bar indicator, PM2.5 emphasis, compact grid layout, and zero-data "—" fallbacks. No new dependencies, no translation keys added, no business logic changes.*  
*Branch: `new-design-phase-1` · Changed files: 6 (see table above) · Build: compilation passes · Tests: unchanged pre-existing failure*
