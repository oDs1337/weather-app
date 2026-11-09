# VELORA — Weather on your side.

A premium weather companion built exclusively for cyclists. VELORA answers one essential question: **is it a good time to ride?**

Powered by real-time meteorological data and an intelligent cycling suitability algorithm, the app delivers temperature, wind, precipitation, air quality, and UV information tailored to what matters when you're on two wheels.

---

## Features

| Feature | Description |
|---------|-------------|
| **Current Conditions** | Temperature, feels-like, wind speed, humidity, precipitation, weather code, and UV index at a glance. |
| **Hourly Forecast** | Scrollable 24-hour breakdown showing temperature, precipitation probability, wind, and weather conditions for every hour. |
| **5-Day Outlook** | Daily overview with min/max temperatures, sunrise/sunset times, total precipitation, max wind speed, UV index, and sunshine duration. |
| **Cycling Suitability Score** | A transparent 0–100 score that evaluates current conditions across six weighted factors (temperature, wind, precipitation, air quality, UV, humidity). |
| **Weather Alerts** | Automatic detection of rain, thunderstorms, extreme heat, freezing conditions, and high winds — displayed as actionable warnings. |
| **Air Quality Index** | PM2.5 and PM10 levels with a calculated AQI value so you can make informed decisions about outdoor exercise. |
| **City Search** | Geocoding-powered city selector backed by Open-Meteo's geocoding API — find any location worldwide in seconds. |
| **Multi-Language Support** | Built-in translations in English, Polish, French, Russian, and Ukrainian with automatic language detection on native platforms. |

### Cycling Score Breakdown

| Factor | Weight | Ideal Conditions |
|--------|--------|-----------------|
| Temperature | 25% | 15–25 °C extends to -5–40 °C tolerance range |
| Precipitation | 25% | Based on current precipitation + next 3 hours probability |
| Wind | 20% | Current speed and gusts combined with forecast data |
| Air Quality | 15% | AQI derived from PM2.5 and PM10 (US EPA breakpoints) |
| Humidity | 10% | 30–60 % comfortable, higher degrades the score |
| UV Index | 5% | Current reading plus daily maximum UV index |

**Grade scale:** Excellent (80+), Good (60–79), Moderate (40–59), Poor (<40).

---

## Supported Platforms

| Platform | Build Target | Status |
|----------|-------------|--------|
| Web (PWA) | Standalone progressive web app | Fully supported |
| Android | Capacitor 8 native wrapper | Native build ready |
| iOS | Capacitor 8 native wrapper | Native build ready |

---

## Screenshots

Screenshots are available in the `preview.jpg` file.

---

## Technology Stack

- **Angular 22** — Standalone components, Signals API, new control flow (`@if`, `@for`)
- **TypeScript ~6.0** — Strict typing across the entire codebase
- **Capacitor 8** — Cross-platform native bridge for Android and iOS
- **RxJS ~7.8** — Reactive streams for HTTP requests and state management
- **ngx-translate 18** — Internationalization with automatic language detection
- **Vitest 5** — Unit testing framework
- **Open-Meteo API** — Free, no-API-key weather data source

---

## Architecture Overview

```
src/
├── app/                                      # Angular application
│   ├── features/                             # Feature modules (pages)
│   │   ├── city-selector/                    # City search & selection page
│   │   ├── current-weather/                  # Main weather dashboard
│   │   │   ├── current-weather-card/         # Current conditions card
│   │   │   ├── daily-forecast/               # 5-day forecast grid
│   │   │   └── hourly-chart/                 # Hourly scrollable chart
│   │   ├── cycling-score-card/               # Cycling suitability score
│   │   ├── cycling-alerts/                   # Weather warnings list
│   │   └── air-quality/                      # AQI display panel
│   ├── core/                                 # Cross-cutting application logic
│   │   └── services/
│   │       ├── language.service.ts           # i18n manager
│   │       ├── platform.service.ts           # Web vs. native detection
│   │       ├── settings-bridge.service.ts    # Native storage bridge
│   │       └── cycling-scoring.service.ts    # Score calculation engine
│   ├── app.routes.ts                         # Route configuration
│   ├── app.config.ts                         # App-level provider config
│   └── app.ts                                # Root component
├── core/                                     # Shared domain logic
│   ├── models/
│   │   └── weather.model.ts                  # TypeScript interfaces (10 types)
│   └── services/
│       └── weather.service.ts                # Open-Meteo API client
├── shared/                                   # Reusable UI primitives
│   ├── components/loading/                   # Loading spinner component
│   ├── components/error/                     # Error display component
│   └── pipes/                                # Weather code → icon/text converters
├── assets/i18n/                              # Translation JSON (5 languages)
├── styles.scss                               # Global design tokens, base styles
└── index.html                                # PWA entry with meta tags
```

### Key Design Decisions

- **Standalone components** throughout — no `NgModule` boilerplate. Routes use lazy-loadable standalone route definitions.
- **Signals-first state** where practical; RxJS streams handle async HTTP pipelines and are converted to signals in the presentation layer.
- **Single responsibility services**: each service has one clear domain (weather API, scoring, i18n, platform detection).
- **No API keys required**: Open-Meteo's free tier powers all data fetching out of the box.
- **PWA-first deployment**: built as a progressive web app with offline-capable manifest and mobile-native meta tags for both iOS Safari and Chrome on Android.

---

## Getting Started

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ (LTS recommended) | Required by Angular 22 tooling |
| npm | 11+ | Specified in `packageManager` field of `package.json` |
| Git | latest | For cloning and version control |

### Installation

```bash
git clone <repository-url>
cd weather-app
npm install
```

### Run the Development Server

```bash
ng serve
```

The app will be available at **http://localhost:4200/**. Changes are hot-reloaded automatically.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` or `ng serve` | Start the dev server with HMR |
| `npm run build` | Production build (output: `dist/weather-app/browser/`) |
| `npm run watch` | Watch mode — builds and reloads on every change |
| `npm run cap:sync` | Build + sync to Capacitor platforms |
| `npm run cap:sync:android` | Build + sync Android only |
| `npm run cap:sync:ios` | Build + sync iOS only |
| `npm run cap:open:android` | Open Android Studio project |
| `npm run cap:open:ios` | Open Xcode project |
| `npm run build:android` | Full pipeline: build → Capacitor sync → open Android Studio |
| `npm run build:ios` | Full pipeline: build → Capacitor sync → open Xcode |
| `ng test` | Run the Vitest unit test suite |

---

## API Integration

VELORA uses the **Open-Meteo** free API — no registration or API keys required.

### Endpoints Used

| Purpose | URL |
|---------|-----|
| Weather data | `https://api.open-meteo.com/v1/forecast` |
| Air quality | `https://air-quality-api.open-meteo.com/v1/air-quality` |
| Geocoding (city search) | `https://geocoding-api.open-meteo.com/v1/search` |

### Data Fetched per Request

- **Current**: temperature, apparent temperature, humidity, wind speed, weather code, UV index, precipitation, rain, snowfall, day/night flag.
- **Hourly (24h)**: temperature, weather code, precipitation probability, wind speed, UV index.
- **Daily (6 days incl. today)**: min/max temperature, sunrise/sunset, total precipitation, max wind speed, max UV index, sunshine duration.
- **Air quality**: PM2.5 and PM10 concentrations.

All requests use Angular `HttpClient` with typed parameters built via `HttpParams`. Error handling is delegated to the platform's standard error pipe in shared components.

---

## Project Structure Reference

| Path | Contents |
|------|----------|
| `src/app/features/` | Feature pages — city-selector, current-weather, cycling-alerts, cycling-score-card, air-quality |
| `src/app/core/services/` | App-level services — language, platform detection, settings bridge, cycling scoring engine |
| `src/core/models/` | Domain models and TypeScript interfaces for weather data |
| `src/core/services/weather.service.ts` | Open-Meteo API client with parameterised query building |
| `src/shared/components/` | Reusable UI primitives — loading spinner, error display |
| `src/shared/pipes/` | Weather code → icon name and text label converters |
| `src/assets/i18n/` | Translation files per language (`en.json`, `pl.json`, `fr.json`, `ru.json`, `uk.json`) |

---

## Progressive Web App Configuration

The app is configured as a fully installable PWA:

- **Manifest**: `public/manifest.json` with all icon sizes (72px → 1024px) including maskable variant.
- **Display mode**: `standalone` — hides the browser chrome on installation.
- **Theme color**: `#111820` — dark slate matching the app's design system.
- **Orientation**: portrait-primary (mobile-first layout).
- **iOS Safari**: apple-mobile-web-app meta tags configured; touch-icon provided.
- **Font**: Manrope (Google Fonts) used as the primary typeface throughout the UI.

---

## Native Platform Configuration

### iOS

| Setting | Value |
|---------|-------|
| Bundle ID | `com.example.weatherapp` |
| Display Name | VELORA |
| Supported Languages | en, pl, fr, ru, uk (CFBundleLocalizations) |
| Xcode project | `ios/App/App.xcodeproj` |

**Manual steps after building:** Replace icons in `Assets.xcassets/AppIcon.appiconset/`, update splash screen in `Assets.xcassets/Splash.imageset/`, and configure signing team.

### Android

| Setting | Value |
|---------|-------|
| Application ID | `com.example.weatherapp` |
| App Name | VELORA |
| Per-app locale | Supported on Android 13+ (API 33+) via Capacitor preferences plugin |
| Android Studio project | Open the `android/` directory |

**Manual steps after building:** Replace launcher icons in `res/mipmap-*` directories and verify signing configuration in `app/build.gradle`.

---

## Testing

Run the full test suite:

```bash
ng test
```

Tests are written with **Vitest 5** using Angular's `@angular/build:unit-test` builder. All components and services include unit specifications under `.spec.ts` files co-located with their implementations.

---

## Building for Production

### Web (PWA)

```bash
npm run build
```

Output directory: `dist/weather-app/browser/`. Deploy these static files to any hosting provider (Netlify, Vercel, GitHub Pages, a CDN, etc.).

### Android

```bash
npm run build:android
```

This runs the full pipeline: Angular production build → Capacitor sync → opens Android Studio for signing and publishing.

### iOS

```bash
npm run build:ios
```

Equivalent pipeline ending in Xcode where you can archive and distribute via App Store Connect or TestFlight.

---

## Design Tokens & Theming

Global styles are defined in `src/styles.scss` using CSS custom properties (design tokens). The theme centres on a dark slate palette (`#111820`) with weather-condition-derived accent colours for backgrounds, cards, and score indicators. Typography is Manrope across all platforms.

---

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests. For major changes, open an issue first to discuss the proposed changes.

---

**VELORA — Weather on your side.**
Cycling weather data, simplified.
