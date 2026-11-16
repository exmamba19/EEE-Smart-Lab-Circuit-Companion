# EEE Smart Lab & Circuit Companion

A modern dashboard of calculators, component decoders, pinout references and a lab data plotter for
Electrical & Electronic Engineering students and engineers.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **lucide-react** and **Recharts**.

## Features

| Module | Route | Highlights |
| --- | --- | --- |
| Dashboard | `/` | Quick-access tool cards, searchable formula cheat sheet (category filters, copy button) |
| Ohm's Law & Power | `/calculators/ohms-law` | Enter any 2 of V / I / R / P, the other 2 are solved live; resistor power-rating suggestion |
| RC / RLC Filter & Transient | `/calculators/rc-rlc` | τ, f<sub>c</sub>, 5τ settling, step response & Bode plots; series RLC f<sub>r</sub>, Q, bandwidth, ζ and damping type |
| Op-Amp Gain | `/calculators/op-amp` | Inverting / non-inverting gain, dB gain, V<sub>out</sub> with rail clipping, live schematic and transfer curve |
| Power Systems & Machines | `/calculators/power-machines` | Star/Delta 3-phase P, Q, S, line/phase V & I, power triangle and PF-correction capacitor sizing; transformer turns ratio & efficiency (max-η load); induction motor N<sub>s</sub> = 120f/P, slip, rotor frequency, torque |
| Resistor & SMD Decoder | `/tools/resistor-decoder` | 4/5-band colour code with live SVG resistor, tolerance range; SMD 3-digit, 4-digit, R-notation and EIA-96 codes |
| Component Decoders & 555 | `/tools/component-decoders` | Ceramic capacitor codes (104, 223K, 4R7 → pF/nF/µF) and reverse encoder; 4-band inductor colour code; 555 astable/monostable designer with waveforms and target-frequency design; LED series resistor (series/parallel strings, E12/E24, wattage); loaded voltage divider |
| Digital Logic & Number Systems | `/tools/digital-logic` | AND/OR/NOT/NAND/NOR/XOR/XNOR simulator with clickable input switches, output LED and live truth table; Binary/Decimal/Octal/Hex and 8/16-bit two's-complement converter with a tappable bit grid |
| IC & MCU Pinouts | `/tools/pinouts` | NE555, LM741, Arduino Uno (ATmega328P), ESP32 DevKit V1 — diagrams, pin table, live search and function filters |
| Lab Data Logger & V-I Plotter | `/tools/lab-plotter` | Editable V-I table, interactive V-I curve, dynamic resistance ΔV/ΔI, linear fit, CSV export/import, auto-save |

### Progressive Web App

The app is an installable, offline-first PWA built with [Serwist](https://serwist.pages.dev/) (the maintained successor of `next-pwa`):

- **Install** from the browser's install prompt / "Add to Home Screen", or the **Install** button in the header (Chromium browsers).
- **Works fully offline**: every page, all JS/CSS chunks, icons and the manifest are precached when the service worker installs.
  The full React Server Component payload of each route is also cached, so in-app navigation keeps working without a network.
- **Offline fallback** (`/~offline`) for any page that isn't cached; an "Offline" badge appears in the header when the connection drops.
- **Manifest** (`public/manifest.json`): name, short name `EEE Lab`, theme/background colours, standard + maskable icons, home-screen
  shortcuts (Ohm's Law, Resistor Decoder, Pinouts, V-I Plotter) and install-dialog screenshots.
- New deployments are picked up automatically (`skipWaiting` + `clientsClaim`; page revisions are keyed to the git commit).

The service worker is only generated for production builds (`npm run build && npm start`); it is disabled in `npm run dev`.
It is skipped inside the native Android app, where every file is already bundled on the device.
Set `NEXT_PUBLIC_SITE_URL` to your deployed origin so Open Graph image URLs are absolute.

All numeric inputs accept SI prefixes: `4.7k`, `100n`, `2M2`, `10u`, `1e-3`.
Light / dark / system theme is supported.

## Project structure

```
src/
├── app/                      # App Router pages (one route per tool), root layout, sw.ts (service worker), ~offline
├── components/
│   ├── calculators/          # OhmsLawCalculator, RCRLCCalculator, OpAmpCalculator, PowerMachines
│   ├── tools/                # ResistorDecoder, ComponentDecoders, DigitalLogic, PinoutReference, LabPlotter
│   ├── dashboard/            # ToolCards, FormulaCheatSheet
│   ├── layout/               # AppShell (sidebar + mobile drawer), Sidebar, ThemeToggle, PwaStatus, NativeBridge
│   └── ui/                   # SIInput, ResultTile, ChartCard, PageHeader
├── data/                     # pinouts.ts, formulas.ts, resistorColors.ts, tools.ts
└── utils/                    # units, electrical, power, digital, components, eseries, resistor decoding, CSV
android/                      # Capacitor Android project (generated; web assets synced from out/)
```

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to ./out (type-checks and lints)
npm start          # serve ./out locally
```

The app is built with `output: "export"` (plus `trailingSlash: true` and unoptimised images), so `out/` is a fully static
bundle that can be deployed to any static host (Vercel, Netlify, GitHub Pages…) or packaged into a native app.

## Android app (Capacitor)

The Android project lives in `android/` (app id `com.prachurzo.eeesmartlab`, name **EEE Smart Lab**, `webDir: out`).
The whole web bundle is copied into the APK, so the app runs 100% offline.

```bash
npm run build:mobile   # next build && npx cap sync android
npm run cap:open       # open android/ in Android Studio → Run ▶ / Build › Generate Signed Bundle
npm run android:run    # build, sync and launch on a connected device / emulator
```

Requirements: Android Studio with Android SDK 36 and JDK 21. Launcher icons (adaptive + legacy) and splash screens
are already generated in `android/app/src/main/res`. The hardware back button navigates back through the app and
exits at the dashboard; status-bar icons follow the light/dark theme; content respects edge-to-edge safe areas.

### Automatic APK builds (GitHub Actions)

`.github/workflows/build-apk.yml` runs on every push to `main` (and on pull requests to `main`, or manually from the
**Actions** tab → *Build Android APK* → *Run workflow*). It builds the static export, runs `cap sync`, compiles the APKs
with Gradle (JDK 21, Android SDK) and uploads them as artifacts:

- `…-debug` — `eee-smart-lab-v<version>-build<run>-debug.apk`
- `…-release` — the release APK (plus an `.aab` for Google Play when signing secrets are configured)

To download: open the workflow run → **Artifacts** → unzip → install the APK on your phone (allow *Install unknown apps*).
`versionCode` is the workflow run number, so newer builds always have a higher version.

**Release signing (optional):** add repository secrets `ANDROID_KEYSTORE_BASE64` (`base64 -w0 release.jks`),
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD`. Without them the release APK is signed with
the shared debug key in `android/app/debug.keystore` (public, standard `android` passwords) — fine for installing and
testing, but Google Play will not accept it. Debug APKs always use that key too, so every new build installs over the
previous one. (Switching an installed app to a different signing key requires uninstalling it first.) Create a key once with:

```bash
keytool -genkeypair -v -keystore release.jks -alias eee-smart-lab -keyalg RSA -keysize 2048 -validity 10000
```

> Pinout and rating data are typical datasheet values. Always verify against the manufacturer's datasheet for your exact part.
