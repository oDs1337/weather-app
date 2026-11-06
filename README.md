# VELORA — Weather on your side.

**VELORA** is a premium cycling weather companion application designed for everyone who rides a bicycle. From road cyclists to casual commuters, VELORA delivers precise, actionable weather information tailored to the cycling experience.

## Product Description

VELORA answers one essential question: *"Is it a good time to ride my bike?"*

The application provides:
- **Current conditions** — temperature, wind, precipitation, and humidity at a glance.
- **Cycling suitability score** — a transparent 0–100 assessment based on real weather data.
- **Hourly forecast** — plan your ride with hour-by-hour weather breakdowns.
- **5-day outlook** — see what's coming so you can plan ahead.
- **Weather alerts** — rain, thunderstorms, extreme heat, and freezing conditions.
- **Air quality information** — PM2.5, PM10, O₃, and NO₂ levels for informed decisions.

## Supported Platforms

| Platform | Status |
|----------|--------|
| Web (PWA) | ✅ Fully supported |
| iOS (Capacitor) | ✅ Native build ready |
| Android (Capacitor) | ✅ Native build ready |

## Technology Stack

- **Angular 22** — Standalone components, signals, and control flow
- **TypeScript ~6.0** — Strong typing throughout
- **Capacitor 8** — Cross-platform native capabilities
- **RxJS ~7.8** — Reactive data streams
- **ngx-translate 18** — Internationalization (5 languages)
- **Vitest 5** — Unit testing

## Supported Languages

| Language | Code |
|----------|------|
| English | en |
| Polish | pl |
| French | fr |
| Russian | ru |
| Ukrainian | uk |

The app automatically detects and uses the device language on native platforms. On web, it respects the browser language setting.

## Development Setup

### Prerequisites

- **Node.js** 18+ (recommended: latest LTS)
- **npm** 11+ (specified in `packageManager`)
- **Angular CLI** 22+ (installed via devDependencies)

### Installation

```bash
# Install dependencies
npm install
```

## Development Server

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when source files change.

## Building

### Web Build

```bash
ng build
```

Production artifacts are output to `dist/weather-app/browser/`.

### Android Build

```bash
npm run build:android
```

This builds the web app, syncs with Capacitor, and opens Android Studio.

### iOS Build

```bash
npm run build:ios
```

This builds the web app, syncs with Capacitor, and opens Xcode.

## Testing

```bash
ng test
```

Runs the Vitest-based unit test suite.

## API Configuration

VELORA uses the **Open-Meteo API** (free, no API key required):

- **Weather**: `https://api.open-meteo.com/v1/forecast`
- **Air Quality**: `https://air-quality-api.open-meteo.com/v1/air-quality`
- **Geocoding**: `https://geocoding-api.open-meteo.com/v1/search`

No environment variables or API keys are needed. The application works out of the box.

## Cycling Score System

The cycling suitability score (0–100) is calculated from six weather factors:

| Factor | Weight | Criteria |
|--------|--------|----------|
| Temperature | 25% | Comfort range 15–25°C ideal, extends to -5–40°C |
| Wind | 20% | Speed and gusts from current + forecast data |
| Precipitation | 25% | Current precipitation + next 3 hours probability |
| Air Quality | 15% | AQI derived from PM2.5 and PM10 levels |
| UV Index | 5% | Current and daily max UV index |
| Humidity | 10% | Comfort range 30–60% ideal |

Scores are labeled: **Excellent** (80+), **Good** (60-79), **Moderate** (40-59), **Poor** (<40).

## Project Structure

```
src/
├── app/
│   ├── app.config.ts          # Application configuration
│   ├── app.ts                 # Root component
│   ├── app.routes.ts          # Route definitions
│   ├── core/
│   │   ├── components/language-selector/  # Language picker
│   │   └── services/
│   │       ├── language.service.ts        # i18n service
│   │       ├── platform.service.ts        # Platform detection
│   │       └── settings-bridge.service.ts # Native settings bridge
│   └── features/
│       ├── city-selector/               # City search & selection
│       ├── current-weather/             # Weather display
│       │   ├── current-weather-card/    # Current conditions card
│       │   ├── daily-forecast/          # 5-day forecast grid
│       │   └── hourly-chart/            # Hourly scrollable chart
│       ├── cycling-alerts/              # Weather warnings
│       └── cycling-score-card/          # Cycling suitability score
├── core/
│   ├── models/weather.model.ts          # TypeScript interfaces
│   └── services/weather.service.ts      # Open-Meteo API client
├── shared/
│   ├── components/loading/              # Loading indicator
│   ├── components/error/                # Error display
│   └── pipes/                           # Weather code & icon pipes
├── assets/i18n/                         # Translation files (5 languages)
├── styles.scss                          # Global design tokens & base styles
└── index.html                           # Entry HTML with PWA metadata
```

## Native Platform Configuration

### iOS
- **Bundle ID**: `com.example.weatherapp` (preserved — do not change)
- **Display Name**: VELORA (set in Info.plist CFBundleDisplayName)
- **Supported Languages**: en, pl, fr, ru, uk (CFBundleLocalizations)

### Android
- **Application ID**: `com.example.weatherapp` (preserved — do not change)
- **App Name**: VELORA (set in strings.xml)
- **Per-app locale**: Supported on Android 13+ (API 33+) via native plugin

## Manual Steps Required

The following steps require manual action after code changes:

### iOS (Xcode)
1. Open `ios/App/App.xcodeproj` in Xcode
2. Replace app icon assets in `Assets.xcassets/AppIcon.appiconset/` with VELORA icons
3. Update splash screen images in `Assets.xcassets/Splash.imageset/` if needed
4. Set signing team and bundle identifier in project settings

### Android (Android Studio)
1. Open the `android` directory in Android Studio
2. Replace launcher icons in `res/mipmap-*` directories with VELORA icons
3. Verify application ID and signing configuration in `app/build.gradle`

### Web
1. Deploy the contents of `dist/weather-app/browser/` to your hosting provider
2. Update favicon.svg and manifest.json as needed for your deployment domain

---

**VELORA — Weather on your side.**
