# VELORA — Ready-to-use brand assets

Design direction: dark graphite + electric lime, mobile-first, premium outdoor technology.

## Contents
- `master/`: 1024px master app icon.
- `ios/AppIcon.appiconset/`: iPhone, iPad, and App Store icon slots with Xcode Contents.json.
- `android/app/src/main/res/`: legacy launcher density icons and adaptive icon resources.
- `web/`: PWA icons, Apple touch icon, favicon.
- `shared-svg/`: individual reusable SVG weather and UI icons.

## iOS / Xcode
Copy `ios/AppIcon.appiconset` into:
`ios/App/App/Assets.xcassets/AppIcon.appiconset`
Replace the existing AppIcon.appiconset contents. Keep the existing asset catalog structure. Open Xcode and verify AppIcon in the asset catalog.

## Android
Copy the contents of `android/app/src/main/res/` into:
`android/app/src/main/res/`
Allow file merge, replacing only matching launcher icon resources. Check AndroidManifest.xml uses `@mipmap/ic_launcher` and `@mipmap/ic_launcher_round`.

## Web / PWA
Copy the contents of `web/` into the project's `public/` directory, preserving folders.
Update `manifest.json` and `index.html` references if needed:
- `assets/icons/icon-192x192.png`
- `assets/icons/icon-512x512.png`
- `assets/icons/apple-touch-icon.png`
- `favicon.svg`

## Important
The launcher assets are generated as individual, correctly-sized files. No sprite-sheet cropping is required.
The SVG icons use `currentColor`; set CSS `color` on the SVG element or inline it in the UI.
Always inspect the app on real iOS and Android devices after replacing native icons.
