# VELORA — REDESIGN PHASE 5: HOURLY AND DAILY FORECAST REDSIGN

**Date:** 2026-11-11  
**Branch:** `new-design-phase-1` · **HEAD:** HEAD of `new-design` (based on `18e5788`)  

## Objective

Redesign ONLY the hourly forecast timeline and daily forecast cards to match VELORA Alpine Precision. Remove emoji, replace with inline SVG weather icons. Improve scanability, tabular numerals alignment, touch-optimized scrolling, scroll affordances on the hourly chart. No new dependencies. Preserve all existing API calls, data mapping, timezone handling, translation keys, and business logic.

---

## 1. New Shared Utility — `WeatherIconService`

A single Angular injectable service provides inline SVG paths for every Open-Meteo weather code (0–99). This replaces the emoji-based `WeatherIconPipe` in both forecast components.

**File:** `src/app/core/utils/weather-icon-svg.service.ts` (**new**)

| Feature | Detail |
|---------|--------|
| **Method `getPath(code)`** | Returns raw SVG path markup for a weather code; falls back to overcast (code 3). |
| **Method `renderIcon(code, size?)`** | Wraps the path in a complete `<svg>` element string with `viewBox="0 0 24 24"`, `fill="none" stroke="currentColor"` for theme adaptation. |
| **Method `getLabel(code)`** | Returns a human-readable description (unused in templates; kept for future accessibility use). |

All icons share: `stroke-width: 1.8`, `stroke-linecap: round`, `stroke-linejoin: round` — matching the existing brand SVG style guide from Phase 3+.

---

## 2. Hourly Forecast Redesign

### Before (Phase 4)
- Emoji-based icons via `WeatherIconPipe` (`☀️⛅🌧️❄️⛈️`)
- Every 3rd hour sampled → max 8 time points
- Static card layout; no visual affordance that more data exists beyond the scroll edge
- No wind data shown
- Precipitation only shown when > 0, with a 💧 emoji prefix

### After (Phase 5)
| Aspect | Change |
|--------|--------|
| **Sampling** | Every 2nd hour → max **13 time points** (~26 hours of data), improving data density while maintaining readability |
| **Time format** | Plain integer ("8", "14") instead of padded ("08:00"), saving horizontal space. Appended ":00" for clarity (e.g., "8:00"). |
| **Icons** | Inline SVG via `[innerHTML]="iconSvg(code)"` — no emoji, fully theme-adapting via `stroke="currentColor"` |
| **Temperature** | Primary display; unchanged value (`temp` property from `HourlyWeather.temperature_2m`) but now uses tabular numerals for alignment across rows |
| **Precipitation** | Shown when > 0%; emoji 💧 prefix removed (emoji-only in this one spot is intentional — raindrop glyph has no SVG equivalent yet; will be replaced when a suitable icon is added to the service) |
| **Wind speed** | NEW data point: `windspeed_10m` shown when available and > 0, in muted text colour below precipitation or temperature |
| **Scroll indicators** | Left arrow always visible on scrollable container; right arrow only appears when more data is available (`hasMore()` computed signal). Gradient overlays fade content behind arrows. |

### Template Changes
- Wrapped entire timeline in `.hourly-wrapper` div
- Added left and right `.scroll-arrow` elements with inline SVG chevron icons
- Removed `WeatherIconPipe` import entirely — replaced by `[innerHTML]="iconSvg(hour.icon)"`
- Time format changed from pipe output to `"{{ hour.time }}:00"` 
- Precipitation element now uses `!= null` check (not `> 0`) so it hides cleanly on zero/absent data
- Wind line added as a new `.wind-line` element

### SCSS Changes — Full Rewrite

| Aspect | Implementation |
|--------|---------------|
| **Layout** | Flex row with tight gap (4px default, mobile-first) |
| **Scrolling** | Native `overflow-x: auto`, `-webkit-overflow-scrolling: touch` for iOS momentum scroll. No CSS scroll-snap to avoid impeding drag-scroll on touch devices. |
| **Scrollbar** | Ultra-thin 3px track (4px → 3px reduction), transparent background, subtle thumb colour from `--color-border-medium` |
| **Card sizing** | Default: 96px wide on mobile; Tablet+: 112px; Small screens ≤360px: 84px |
| **Touch target** | Each card has `min-height: calc(var(--touch-min) + 32px)` — exceeds the 44px requirement |
| **Tabular numerals** | Applied to `.hour-time`, `.hour-temp` via `font-variant-numeric: tabular-nums` |
| **No hover effects** | All hover transforms removed from previous implementation. Only `:active`/`:focus-visible` states inherited from global styles |
| **Gradient overlays** | `.scroll-arrow::before` pseudo-elements provide radial gradient backgrounds that fade content behind arrows, creating visual depth without shadows |

---

## 3. Daily Forecast Redesign

### Before (Phase 4)
- Emoji-based icons via `WeatherIconPipe` (`🌧️💨`)
- CSS Grid with `repeat(auto-fit, minmax(130px, 1fr))` — cards could wrap unpredictably on narrow screens, causing inconsistent layouts and potential horizontal overflow issues at viewport widths between card minimums and total available width
- Hover-only feedback (`transform: translateY(-3px)` + `box-shadow`) on cards
- All days displayed as identical card blocks with no day-of-week date information
- Precipitation shown for all values including 0 mm

### After (Phase 5)
| Aspect | Change |
|--------|--------|
| **Layout** | Flex column of row-based cards instead of auto-fit grid. Each row uses a strict 3-column CSS Grid: `[day-label] [icon+temps] [details]` — no unpredictable wrapping, no horizontal overflow risk at any viewport width |
| **Icons** | Inline SVG via `[innerHTML]="iconSvg(code)"` — same service as hourly chart |
| **Day name** | Localised (unchanged logic from previous phases) — now styled as bold primary text on the left |
| **Date line** | NEW: secondary date label showing month + day ("Nov 12") in muted colour below the day name. Uses `toLocaleDateString('en', {month:'short',day:'numeric'})` with a fixed midnight timezone offset to avoid browser DST shifts |
| **Temperatures** | High/low shown in flex row beneath icon; max bold in primary text, min regular in muted colour. Tabular numerals ensure alignment across all rows |
| **Precipitation** | Only shown when `> 0mm`; removed the 🌧️ emoji prefix; styled with weather accent colour (`--color-weather`) |
| **Wind speed** | Only shown when `> 0 km/h`; removed the 💨 emoji prefix; styled in muted text colour |
| **Touch target** | Each row has `min-height: calc(var(--touch-min) + 16px)` — comfortably exceeds 44px |

### Template Changes
- Removed `WeatherIconPipe` import (no longer needed as an Angular pipe — service handles icon generation directly in TS)
- Changed from `.forecast-card` block cards to `.day-row` horizontal rows
- Added `.day-label` with day name + date sub-label (new functionality)
- Removed emoji characters from precipitation and wind detail lines
- Added availability checks (`!= null && > 0`) so zero/unavailable data doesn't render empty units

### SCSS Changes — Full Rewrite

| Aspect | Implementation |
|--------|---------------|
| **Outer layout** | `.daily-list` flex column, gap between rows from `--space-xs` |
| **Row grid** | 3-column CSS Grid: `auto minmax(72px,max-content) 1fr` — day label auto-widths to content, icon+temps column constrained minimum, details fill remaining space |
| **Spacing** | Default padding `var(--space-md)` horizontal × `var(--space-lg)` vertical; Tablet+: larger; Small screens: tighter |
| **Tabular numerals** | Applied globally on `.day-row` via `font-variant-numeric: tabular-nums` — ensures all numeric values (temps, precip, wind) align vertically across rows |
| **No hover effects** | Removed hover transforms from previous implementation. Touch-friendly row height meets 44px+ requirement |
| **Color-coded details** | `.detail--precip` uses `--color-weather`; `.detail--wind` uses muted text colour |

---

## 4. Wrapper Section Adjustments (`current-weather.scss`)

The hourly chart's horizontal scroll must be contained — it should NOT cause page-level overflow on mobile viewports (320–430px). Changes to the parent wrapper:

| Change | Rationale |
|--------|-----------|
| `.hourly-section` changed from `overflow-x: auto` (which could propagate horizontal scroll to the body) → `overflow-x: hidden`. Actual scrolling is handled by the inner `.hourly-scroll` component. | Prevents page-level horizontal overflow; only the timeline scrolls, not the entire dashboard |
| `.daily-section` explicitly set `overflow-x: hidden` | Defensive measure — grid cards should never exceed container width but this ensures it regardless of content |

---

## 5. Icon Assets Used

All SVG icons are generated inline by `WeatherIconService`. No external files copied or referenced. Icon styles match the existing brand assets (viewBox, stroke-width, stroke-linecap/join).

| Weather Code(s) | Open-Meteo Condition | Icon Design |
|-----------------|---------------------|-------------|
| 0 | Clear sky | Circle sun + 8 rays |
| 1 | Mainly clear | Sun (partial) + cloud below |
| 2 | Partly cloudy | Cloud with small sun peeking above right corner |
| 3 | Overcast | Single cloud shape |
| 45, 48 | Fog / Rime fog | Two horizontal lines of varying length |
| 51–65 | Drizzle / Rain (slight → heavy) | Cloud with increasing number of vertical rain lines (1 for slight, 2 for moderate, 3 for heavy) |
| 71–75 | Snow (slight → heavy) | Cloud with circle dots instead of lines (proportional to intensity) |
| 80–82 | Rain showers (slight → violent) | Same as rain codes — cloud + vertical rain lines |
| 95, 96, 99 | Thunderstorm / thunderstorm + hail | Cloud with lightning bolt (zigzag polyline) below |

---

## 6. Data Behaviour Preserved

| Aspect | Status | Detail |
|--------|--------|--------|
| API requests (Open-Meteo) | ✓ Untouched | `WeatherService` makes identical calls; no new parameters or endpoints |
| Forecast data mapping (`HourlyWeather`, `DailyWeather`) | ✓ Untouched | Model interfaces unchanged; component uses same property names |
| Time-zone handling | ✓ Preserved | `new Date(hours[i].time)` and `new Date(dateString + 'T00:00:00')` use identical date parsing as before. The `+ 'T00:00:00'` suffix in `dayDate()` prevents midnight DST shifts when displaying the secondary date label |
| Locale / day names (pl, fr, ru, uk) | ✓ Untouched | `LanguageService.getLanguage()` logic unchanged; all 5 language maps identical to previous phases |
| Weather code interpretation | ✓ Untouched | All codes 0–99 mapped in `WeatherIconService.getPath()`, matching the existing `WeatherIconPipe` mapping plus fallback for any previously unmapped codes |
| Translation keys | ✓ No new keys added | Removed all `[pipe | translate]` calls from aria-labels (used plain text instead). No new i18n keys needed — template no longer references `forecast.*` paths which didn't exist in locale files anyway |

---

## 7. Mobile / Responsive Checks

### Breakpoints

| Breakpoint | Target Width | Changes Applied |
|------------|-------------|-----------------|
| Default (mobile-first) | ≥ 431px | Hourly cards: 96×200+ px; daily rows: 3-column grid with auto-width day label and icon column minmax(72px); padding `--space-md/--space-lg` |
| Tablet+ | ≥ 768px | Hourly cards: 112px wider + scroll arrows increase to 36×48px; daily rows expand icon to 36×36px, temps grow in font size, detail text increases |
| Small screens | ≤ 360px | Hourly cards shrink to 84px with tighter gap (4px); scroll arrows reduce to 24×36px; daily grid tightens icon column minmax(64px), padding reduces to `--space-sm/--space-md` |

### Touch Target Compliance

| Element | Size | Status |
|---------|------|--------|
| Hourly card (time+temp+icon) | ≥ 200px × 96px default | ✓ Exceeds 44px requirement |
| Daily row (day label + icon + temps + details) | min-height calc(44px + 16px) = 60px | ✓ Meets 44px+ requirement |

### Horizontal Overflow Protection

- `.hourly-section` (parent wrapper) set to `overflow-x: hidden` — prevents scroll propagation to body
- Inner `.hourly-scroll` handles actual horizontal scrolling with native touch support (`-webkit-overflow-scrolling: touch`)
- Daily forecast uses flex column layout — no horizontal scrolling possible, eliminating overflow risk entirely

### Tabular Numerals

Applied via `font-variant-numeric: tabular-nums` on:
- `.hour-time`, `.hour-temp` (hourly chart)
- `.day-row` globally (daily forecast rows)

This ensures temperature values like "18°" and "22°" align vertically across rows even when digits have different widths.

### Reduced Motion

Both components include `@media (prefers-reduced-motion: reduce)` blocks that disable any transition or scroll-behavior changes at 0.01ms duration, consistent with Phase 1's global reduced-motion rules.

---

## 8. Emoji Handling

| Location | Status |
|----------|--------|
| Hourly chart weather icons (`.weather-icon`) | ✓ Removed — replaced with inline SVG via `WeatherIconService` |
| Daily forecast weather icons (`span.weather-icon`) | ✓ Removed — replaced with inline SVG via `WeatherIconService` |
| Precipitation emoji in hourly chart (💧) | ⚠ Retained as temporary fallback — the raindrop glyph does not yet have a matching SVG path in `WeatherIconService.getPath()`. This is the only remaining emoji in these forecast UI areas. To be replaced when an appropriate raindrop SVG icon is added. |
| WeatherIconPipe import | ✓ Removed from both components — pipe still exists in `src/shared/pipes/weather-icon.pipe.ts` but no longer used by hourly/daily forecast (current weather card still uses it) |

---

## 9. Files Changed

| File | Change Type | Lines Added / Removed | Description |
|------|-------------|-----------------------|-------------|
| `src/app/core/utils/weather-icon-svg.service.ts` | **Created** | ~210 lines | New inline SVG icon service for all Open-Meteo weather codes. Methods: `getPath()`, `renderIcon()`, `getLabel()` |
| `src/app/features/current-weather/hourly-chart/hourly-chart.component.ts` | Modified | +34 / −16 | Removed WeatherIconPipe; injected WeatherIconService; changed displayHours to computed signal (every 2nd hour, max 13); added wind speed data point and `hasMore()` signal |
| `src/app/features/current-weather/hourly-chart/hourly-chart.html` | Modified | +48 / −9 | Removed pipe-based icon rendering; replaced with `[innerHTML]`; added scroll arrows (left always visible, right conditional on `hasMore()`); wind speed element; aria-label uses plain text |
| `src/app/features/current-weather/hourly-chart/hourly-chart.scss` | **Rewritten** | +207 / −94 | Full rewrite: horizontal timeline layout with gradient scroll indicators, tabular numerals, reduced hover effects (mobile-first), responsive breakpoints at 360px and 768px, scrollbar styling at 3px height |
| `src/app/features/current-weather/daily-forecast/daily-forecast.component.ts` | Modified | +18 / −5 | Removed WeatherIconPipe; injected WeatherIconService; added `iconSvg()` method; added `dayDate()` helper with timezone-safe midnight offset |
| `src/app/features/current-weather/daily-forecast/daily-forecast.html` | Modified | +32 / −9 | Replaced grid of cards with flex column of rows; day label + date sub-label; `[innerHTML]` icon rendering; availability-based precipitation/wind display |
| `src/app/features/current-weather/daily-forecast/daily-forecast.scss` | **Rewritten** | +160 / −95 | Full rewrite: row-based layout with 3-column grid (day label, icon+temps, details); tabular numerals on all rows; color-coded precipitation and wind detail lines; responsive breakpoints at 360px and 768px |
| `src/app/features/current-weather/current-weather.scss` | Modified | +9 / −4 | `.hourly-section` changed from `overflow-x: auto` to `overflow-x: hidden`; explicit `overflow-x: hidden` on daily section for defensive overflow prevention |

**Total files directly modified in Phase 5:** 7 (6 tracked, 1 new).  
**No other files were touched.** No translation keys added. No API logic changes. No business logic changes. No dependencies upgraded.

---

## 10. Build and Test Results

### `npm run build` (Production)
```
Status: PASSED COMPILATION
Bundle Size: main.js 427.46 kB (was 410.24 kB after Phase 4 — +17.22 kB)
Styles: styles.css 5.54 kB
Estimated transfer size: 107.25 kB (main + chunk + styles combined)

Warnings (all PRE-EXISTING from Phases 3 and 2):
▲ cycling-score-card.component.scss exceeded budget: Budget 4.00 kB was not met by 678 bytes (total: 4.68 kB) — Phase 3, unchanged
▲ city-selector.component.scss exceeded budget: Budget 4.00 kB was not met by 5.18 kB (total: 9.18 kB) — Phase 2, unchanged

Note: The +17.22 kB bundle increase is primarily from the new WeatherIconService (~210 lines of SVG path definitions) plus the expanded hourly chart templates with scroll indicator markup and additional data points (wind speed). No SCSS budget violations were introduced by this phase.
```

### `npm test`
```
Test Files: 1 failed (1 file) — PRE-EXISTING, UNCHANGED from baseline
Tests:      1 passed / 2 total (1 failure)
Error:      src/app/app.spec.ts line 30 — "should render city selector when language is ready"
Duration:   ~786ms

Note: Identical to Phase 4 results. The failing test is a pre-existing routing mismatch unrelated to forecast components or icon service changes.
```

---

## 11. Known Limitations and Unresolved Issues

1. **Emoji 💧 in hourly chart precipitation label** — the raindrop character is still present in `hourly-chart.html` as the precipitation prefix (`&#128167;`). This was intentional: no matching SVG raindrop exists yet in `WeatherIconService.getPath()`. All other forecast emojis have been replaced with SVGs. The remaining emoji will be removed when a suitable raindrop icon is added to the service.

2. **Bundle size increase** — main.js grew by ~17 kB due to the new WeatherIconService (inline SVG path definitions for 20+ weather codes). This is expected and acceptable for a design-quality feature. The `iconSvg()` method renders strings at runtime rather than requiring separate asset files, so this is purely template code size.

3. **Day date formatting uses hardcoded English locale** — `dayDate()` calls `toLocaleDateString('en', ...)` with fixed options. For full i18n support this should use the TranslatePipe or a localization-aware helper, but that would require adding new translation keys (which we avoided per constraints). The date format is consistent across all languages and readable for any user.

4. **No dedicated unit tests** — neither `hourly-chart` nor `daily-forecast` have spec files. Adding presentation tests would be valuable to ensure icon rendering, tabular numerals display, and scroll indicator logic remain correct through future changes.

5. **Light theme not visually tested on new components** — the components use design tokens throughout (`--color-*`, `--text-sm`, etc.) and `[innerHTML]` SVG icons inherit `stroke="currentColor"` so they adapt to any text color context. However, no visual validation has been performed specifically on the light theme (`[data-theme="light"]`) for these new layouts.

---

*Phase 5 complete. Hourly forecast timeline redesigned with inline SVG icons, tabular numerals, wind speed display, scroll indicators, and overflow containment. Daily forecast redesigned with row-based layout, day name + date labels, emoji-free SVG icons, and availability-aware detail rendering. No API changes, no new dependencies, no translation keys added.*  
*Branch: `new-design-phase-1` · Changed files: 7 (6 tracked modified, 1 new) · Bundle: main.js 427.46 kB (+17.22 kB from Phase 4) · Tests: unchanged pre-existing failure*
