# VELORA — REDESIGN PHASE 3: WEATHER DASHBOARD AND CYCLING SCORE REDSIGN

**Date:** 2026-11-11  
**Branch:** `new-design-phase-1` · **HEAD:** `new-design` branch (based on HEAD `18e5788`)  

## Objective

Redesign the weather dashboard hierarchy to make cycling suitability the primary hero experience. Redesign the Cycling Score card with large, clear numerical score, SVG icons replacing emojis, and scanable subscore grid. Add a colour-coded dynamic advice box contextualised by score. Improve the current weather card layout with shared SVG asset icons instead of emoji.

## Product Priority

The user should understand in seconds:
1. **Is it a good time to ride?** → Hero Cycling Score ring + rating label
2. **What is the Cycling Score?** → Large 3-digit number inside ring, out of 100
3. **Main reasons behind that score?** → Six subscores with SVG icons and numeric values
4. **What should the cyclist pay attention to?** → Dynamic advice box below score with contextual icon and message
5. **Current weather conditions** → Current Weather Card below alerts/AQI

## UX Changes — Dashboard Hierarchy

### Before (Phase 2)
```
Back Button
├── Cycling Score Card
│   └── Dynamic Advice Box (unstyled, no visible CSS rules)
├── Cycling Alerts
├── Air Quality
├── Current Weather Card
├── Hourly Forecast
└── Daily Forecast
```

Dynamic advice box had no SCSS styling — it rendered as a plain `<div>` with a generic fade animation but no background, icon, border, or visual distinction from surrounding content.

### After (Phase 3)
```
Back Button (reduced opacity, design-token colours)
└── HERO SECTION (flex column, gap: md)
    ├── Cycling Score Card (redesigned — see below)
    └── Dynamic Advice Box (styled callout with colour-coded icon + group label)

Cycling Alerts (wrapper only; component keeps its own styling)
Air Quality (wrapper only; component keeps its own styling)
Current Weather Card (redesigned — see below)
Hourly Forecast
Daily Forecast
```

**Rationale:** Cycling Score is now visually grouped with the dynamic advice box in a shared `hero-section`. This puts both pieces of cycling-relevant context above-the-fold on mobile before other sections push down. The alerts and AQI sit between the hero and current weather, following the priority order: score → advice → warnings → conditions → forecast.

### Back Button
- Transparent background instead of semi-transparent white overlay
- Uses `--color-border-subtle` for border (adapts to theme)
- Secondary text colour (`--color-text-secondary`) — less prominent than content cards
- Hover adds subtle electric-lime tint and primary text colour
- Active state applies scale(0.98) for touch feedback

## UX Changes — Cycling Score Card

### Before
- Title + city in a side-by-side header with `justify-content: space-between`
- Circular SVG ring at 120×120px inside an `.overall-score` container with gradient backgrounds per score group
- Six subscore rows using emoji icons (`🌡️💨🌧️🌬️☀️💧`) in `.individual-scores`
- Score status displayed as a small pill badge next to each value

### After
- Compact header: `<h2>` + city span, both using design tokens for spacing and sizing
- Hero ring at 140×140px with thicker stroke (7 vs 8) on `--color-border-medium` track
- Score number displayed as large `var(--text-3xl)` / 1.75rem bold inside the ring, with `/100` suffix below in muted secondary text
- Rating label shown beneath ring: colour-coded via CSS class (`excellent`, `good`, `fair`, `poor`) mapped to brand colours (electric lime → warning orange)
- Six subscore rows now use inline SVG icons (no emoji), each icon sized at 28×28px and coloured by group
- Score values displayed as bold numbers aligned right; labels on left
- Status badges row added below subscores — small pill badges with the same group-based colour coding

### SVG Icons Replacing Emojis

| Factor | Old Emoji | New SVG Icon | Source |
|--------|-----------|--------------|--------|
| Temperature | 🌡️ | Thermometer (3-line: stem, bulb, mercury line) | Hand-drawn inline, stroke `currentColor` 1.8 |
| Wind | 💨 | Three curved wind lines + arrow head | Styled after `velora_brand_assets/shared-svg/icon-weather-wind.svg` |
| Precipitation | 🌧️ | Raindrop with falling drops (3水滴) | Styled after `velora_brand_assets/shared-svg/icon-weather-rain.svg` |
| Air Quality | 🌬️ | Central circle with 4 radiating lines | Simplified generic icon, stroke `currentColor` |
| UV Index | ☀️ | Sun: central circle + 8 rays (cardinals + ordinals) | Styled after `velora_brand_assets/shared-svg/icon-weather-sun.svg` |
| Humidity | 💧 | Raindrop shape with internal water-line arc | Styled after `velora_brand_assets/shared-svg/icon-weather-drop.svg` |

**All icons use:**
- `viewBox="0 0 24 24"` (except humidity at `64×64`) for consistent sizing
- `fill="none" stroke="currentColor"` so they inherit component text colour and adapt to score group styling
- `stroke-width: 1.8` or `2.8` matching the shared asset style guide

## UX Changes — Dynamic Advice Box

### Before
Plain `<div class="dynamic-advice-box">` with `<p>{{ dynamicAdvice() }}</p>`. No CSS rules existed in any `.scss` file — the box rendered with no background, border, padding, or icon. Only inherited `fade-in-up` animation from global styles.

### After
Full callout card with:
- **Icon circle:** 40×40px circular container, colour-coded by score group (electric-lime for ≥80, green-yellow for ≥60, amber for ≥40, orange-red for <40)
- **Group label:** Small uppercase text (`excellent`, `good`, `moderate`, `poor`) above the advice paragraph in matching colour
- **Advice text:** 15px body copy at primary text colour, line-height 1.4
- **Layout:** Flex row on ≥360px screens; icon hides on ≤360px to save space

### Icon Selection Logic
The advice box icon adapts to the cycling score's group:
| Score Range | Icon Used | Meaning |
|-------------|-----------|---------|
| ≥ 80 | Heart with pulse line | Positive — riding conditions are favourable |
| ≥ 60 and < 80 | Wind lines | Neutral — mild considerations apply |
| ≥ 40 and < 60 | Warning triangle (from `velora_brand_assets/shared-svg/icon-alert.svg`) | Caution — notable weather issues present |
| < 40 | Warning circle with diagonal line | Danger — significant hazards for cycling |

## UX Changes — Current Weather Card

### Before
- Emoji icons in the detail grid: 💧 humidity, 💨 wind, 🌧️ precipitation
- Location icon as a standalone `📍` element above the time header
- Generic `.detail-icon` class with emoji sizing at 1.25rem

### After
- **Location indicator:** SVG pin icon (from `velora_brand_assets/shared-svg/icon-location.svg`, converted to `64×64` viewBox, `stroke-width: 2.8`) inline next to uppercase "Current Conditions" label in secondary text colour with letter-spacing
- **Detail icons:** Three SVGs replacing the three emojis:
  - Humidity → Raindrop shape (`velora_brand_assets/shared-svg/icon-weather-drop.svg`, converted)
  - Wind → Curved wind lines (`velora_brand_assets/shared-svg/icon-weather-wind.svg`)
  - Precipitation → Rain with drops (`velora_brand_assets/shared-svg/icon-weather-rain.svg`)
- Icons styled at 24×24px using `currentColor` + `--color-weather` for brand consistency
- Detail grid restructured from nested `.detail-info` flex to simple `.detail-content` column — less nesting, cleaner cascade

### Template Cleanup
Removed unused `<h2>` time header (was a leftover from Phase 0) and the `LocalizedDatePipe` import that was causing an Angular compiler warning. The current weather card now only uses pipes actually present in its template: `TranslatePipe`, `WeatherCodePipe`, `WeatherIconPipe`.

## Responsive Checks Performed

### Breakpoints
| Breakpoint | Target Width | Changes Applied |
|------------|-------------|-----------------|
| Default (mobile-first) | ≥ 431px | Full hero layout, advice box icon visible, current card details at 24×24px icons |
| `max-width: 768px` | ≤ 768px | Back button becomes full-width on small screens; cycling-score-card maintains layout via token sizing |
| `max-width: 360px` | ≤ 360px | Advice box icon hidden to save horizontal space; current card detail items reduce min-height from 80px to 70px; temperature drops from 3.5rem to ~2.8rem equivalent via existing token cascade |

### Touch Targets
| Element | Target Size | Status |
|---------|------------|--------|
| Back button | `min-height: 48px` (global `touch-min: 44px`) | ✓ Meets 44px+ requirement |
| Cycling Score ring area | 140×140px visible, full card touchable | ✓ Exceeds 44px |
| Subscore items | ~60px height each | ✓ Exceeds 44px |

### Safe-Area Inset Support
Inherited from Phase 1 global styles. All cards sit inside `.weather-container` which is centered by parent layout respecting safe-area padding on `<body>`.

## Critical Business-Logic Protection — Confirmed

The following were **NOT modified** in this phase:

| Item | Status |
|------|--------|
| `CyclingScoringService.calculateCyclingScore()` scoring weights (0.30, 0.20 × 4, 0.05 × 2) | ✓ Untouched |
| Veto hard caps (AQI: 20/40/64; Precip: 25/45/55; Wind: 30/58; Ice: 15/35/48) | ✓ Untouched |
| `calculateForecastIssues()` thresholds and detection logic | ✓ Untouched |
| `getDynamicAdvice()` message selection hierarchy | ✓ Untouched (only the UI presentation changed — new icon, label, layout) |
| Weather API data interpretation | ✓ Untouched |
| CyclingScore / CyclingIssue / CyclingScoreDetails type definitions in `weather.model.ts` | ✓ Untouched |
| Translation keys (`en.json`, `pl.json`, etc.) | ✓ Untouched |
| Route configuration (`app.routes.ts`) | ✓ Untouched |

**Only changes to the scoring service file:** Converting `@Input()` decorators to Angular signal inputs (`input.required<CyclingScore>()`) in `cycling-score-card.component.ts`. This is a component-level change that does not affect how the service calculates or returns scores. The interface contract between `CyclingScoringService` and its callers remains identical: `{ score: CyclingScore, issues: CyclingIssue[], dynamicAdvice?: string }`.

## Files Changed (8 tracked files)

| File | Change Type | Description |
|------|-------------|-------------|
| `src/app/features/cycling-score-card/cycling-score-card.component.ts` | Modified | Converted from `@Input()` to signal inputs (`input.required<>`). Removed unused `computed` import. Added `subscores()` method returning structured subscore data for template-driven SVG icon selection and badge rendering. |
| `src/app/features/cycling-score-card/cycling-score-card.html` | Rewritten | New template with SVG-based layout: hero score ring (140×140px), six subscore rows using inline SVG icons instead of emojis, status badges row beneath. Uses Angular `@for/@if` blocks and signal input syntax (`score()`, `city()`). |
| `src/app/features/cycling-score-card/cycling-score-card.component.scss` | Rewritten | Full rewrite for new class names: `.cycling-score-card`, `.hero-score`, `.score-ring`, `.ring-progress`, `.score-display`, `.subscores`, `.subscore-item`, `.icon-wrapper`, `.status-badges`, `.badge`. Dynamic ring colour via score-group classes. Tablet+ responsive breakpoints at 768px+. Reduced-motion support. |
| `src/app/features/current-weather/current-weather.html` | Modified | Restructured dashboard hierarchy with named `<section>` elements: `.hero-section` (cycling score + advice), `.alerts-section`, `.aqi-section`. Added SVG icon in dynamic advice box, colour-coded group label above advice paragraph. Back button now has explicit `aria-label`. |
| `src/app/features/current-weather/current-weather.scss` | Rewritten | New SCSS for dashboard hierarchy: back button tokenised, hero section flex column with gap, full `.advice-box` styling (icon circle + content layout), `.hourly-section` / `.daily-section` using design tokens. Tablet+ and ≤360px responsive breakpoints. Reduced-motion support. |
| `src/app/features/current-weather/current-weather-card/current-weather.html` | Modified | Replaced emoji icons (`📍💧💨🌧️`) with inline SVG assets from brand reference files. Restructured detail grid from nested flex to `.detail-grid` + `.detail-content`. Removed old `<h2>` time header. Added `aria-hidden="true"` on decorative SVGs. |
| `src/app/features/current-weather/current-weather-card/current-weather.scss` | Rewritten | Updated all class names for new template structure: `.location-indicator`, `.icon-wrapper` (for detail icons), `.detail-grid`, `.detail-content`. Icon sizing at 24×24px on mobile, 26×26px tablet+. Detail grid min-height increased to 80px for comfort. Responsive breakpoints at 768px+ and ≤360px. |
| `src/app/features/current-weather/current-weather-card/current-weather-card.component.ts` | Modified | Removed unused `LocalizedDatePipe` import (was causing Angular compiler warning NG8113) after template was rewritten without the `<h2>` that used it. No functional change to component behaviour. |

## Test / Build Results

### `npm run build`
```
Status: PASSED COMPILATION
Bundle Size: main.js 404.43 kB (was 404.43 kB — unchanged from Phase 2 baseline)
Styles: styles.css 5.54 kB

Warnings (all pre-existing or minor):
▲ cycling-score-card.component.scss exceeded budget: Budget 4.00 kB was not met by 678 bytes (total: 4.68 kB)
  - Previous phase (Phase 2): 264 bytes over (4.26 kB). INCREASED by 414 bytes due to new SVG-based subscore styling, badges section, and tablet breakpoints added in Phase 3.

▲ city-selector.component.scss exceeded budget: Budget 4.00 kB was not met by 5.18 kB (total: 9.18 kB)
  - PRE-EXISTING from Phase 2. No changes to this file.
```

### `npm test`
```
Test Files: 1 failed (1 file) — PRE-EXISTING, UNCHANGED from baseline
Tests:      1 passed / 2 total (1 failure)
Error:      src/app/app.spec.ts line 30 — "should render city selector when language is ready"
Duration:   ~720ms

Note: The pre-existing test failure in app.spec.ts is unrelated to any Phase 3 changes. 
The failing test expects <app-city-selector> to be present in the App component's DOM,
but the app uses Angular routing with <router-outlet>. This was identified as a
pre-existing issue in Phase 0 and has not been modified in this phase.
```

## Remaining Issues

1. **SCSS budget exceeded** — `cycling-score-card.component.scss` is now 4.68 kB (budget: 4.00 kB). The increase from the previous 4.26 kB (+414 bytes) is due to the new subscore grid styling, badge section styles, and responsive breakpoints added in Phase 3. Resolution would require further refactoring — deferred to a future bundle-optimisation phase.

2. **No dedicated unit tests** for the Cycling Score component or its SVG icon rendering logic. This was a gap before Phase 0 and remains open. Adding presentation tests is outside this phase's scope but recommended for future phases.

3. **Light theme support not validated.** All new styles use `var(--design-token)` references, so they should inherit correctly from the light theme defined in Phase 1 (`[data-theme="light"]`). However, no automated visual test exists for the light theme specifically — this would be valuable to add once a theme toggle is implemented.

4. **`prefers-reduced-motion`** support was added to new styles but not validated with an actual assistive device or browser flag. The rules are structurally correct (all transitions/animations set to 0.01ms) but should be verified on real hardware in future QA cycles.

## Deferred Work

- **Cycling Alerts redesign:** Explicitly excluded from this phase scope
- **Air Quality redesign:** Explicitly excluded from this phase scope
- **Hourly / Daily Forecast redesign:** Explicitly excluded from this phase scope
- **Bundle size optimisation:** SCSS budgets to be brought under 4 kB limit in a future dedicated phase
- **Theme toggle UI + persistence mechanism:** Deferred (no such mechanism existed before Phase 3)

---

*Phase 3 complete. Cycling Score card redesigned with SVG icons, hero ring layout, and scanable subscore grid. Dynamic advice box styled as colour-coded callout. Dashboard hierarchy reorganised with cycling score as the primary hero. Current weather card updated to use shared SVG assets.*  
*Branch: `new-design-phase-1` · Changed files: 8 (see table above)· Scoring service business logic: NOT modified · Build: compilation passes · Tests: unchanged pre-existing failure*
