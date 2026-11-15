# EEE Smart Lab & Circuit Companion

A modern dashboard of calculators, component decoders, pinout references and a lab data plotter for
Electrical & Electronic Engineering students and engineers.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **lucide-react** and **Recharts**.

## Features

| Module | Route | Highlights |
| --- | --- | --- |
| Dashboard | `/` | Quick-access tool cards, searchable formula cheat sheet (59 formulas, category filters, copy button) |
| Ohm's Law & Power | `/calculators/ohms-law` | Enter any 2 of V / I / R / P, the other 2 are solved live; resistor power-rating suggestion |
| RC / RLC Filter & Transient | `/calculators/rc-rlc` | τ, f<sub>c</sub>, 5τ settling, step response & Bode plots; series RLC f<sub>r</sub>, Q, bandwidth, ζ and damping type with step response |
| Op-Amp Gain | `/calculators/op-amp` | Inverting / non-inverting gain, dB gain, V<sub>out</sub> with rail clipping, live schematic and transfer curve |
| Resistor & SMD Decoder | `/tools/resistor-decoder` | 4/5-band colour code with live SVG resistor, Ω/kΩ/MΩ formatting, tolerance range; SMD 3-digit, 4-digit, R-notation and EIA-96 codes |
| IC & MCU Pinouts | `/tools/pinouts` | NE555, LM741, Arduino Uno (ATmega328P), ESP32 DevKit V1 — diagrams, pin table, live search and function filters (PWM, ADC, I2C, GND, VCC …) |
| Lab Data Logger & V-I Plotter | `/tools/lab-plotter` | Editable V-I table, interactive V-I curve, dynamic resistance ΔV/ΔI (per segment and between any two points), linear fit, CSV export/import, auto-save |

All numeric inputs accept SI prefixes: `4.7k`, `100n`, `2M2`, `10u`, `1e-3`.
Light / dark / system theme is supported.

## Project structure

```
src/
├── app/                      # App Router pages (one route per tool) + root layout
├── components/
│   ├── calculators/          # OhmsLawCalculator, RCRLCCalculator, OpAmpCalculator
│   ├── tools/                # ResistorDecoder, PinoutReference, LabPlotter
│   ├── dashboard/            # ToolCards, FormulaCheatSheet
│   ├── layout/               # AppShell (sidebar + mobile drawer), Sidebar, ThemeToggle
│   └── ui/                   # SIInput, ResultTile, ChartCard, PageHeader
├── data/                     # pinouts.ts, formulas.ts, resistorColors.ts, tools.ts
└── utils/                    # units (SI parse/format), electrical math, resistor decoding, CSV
```

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (type-checks and lints)
npm start
```

> Pinout and rating data are typical datasheet values. Always verify against the manufacturer's datasheet for your exact part.
