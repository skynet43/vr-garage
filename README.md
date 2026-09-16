# VR Garage — Interactive Automotive Repair Platform

VR Garage pairs **step-by-step repair procedures** with an **interactive 3D engine viewer**
(WebXR-ready) so technicians can see exactly what each step touches before they pick up a wrench.

Current data pack covers the **Jeep 2.0L Hurricane turbo (EC1 / EC3)** across Wrangler JL,
Cherokee KL and Grand Cherokee WL — including eTorque and ESS variants.

## Features

- **3D engine viewer** — orbit / zoom / explode a procedural 2.0L turbo model, click any
  component for service notes, torque values and the exact procedure steps that touch it.
  One-click **Enter VR** when a headset is connected (WebXR).
- **Repair procedures** — removal + installation steps with safety callouts, manual
  cross-references, tool lists, linked torque specs and per-step 3D jumps. Progress is saved.
- **Diagnostics** — DTC lookup (P0300, P0016, P0299…) with causes and pinpoint fixes.
- **Parts database** — part numbers, pricing, stock levels and bin locations.
- **Torque specs** — searchable, sequence-aware tightening data.
- **Global search** — one box across procedures, parts, DTCs and torque.
- **Vehicle profiles** — switch the vehicle on the lift; content filters to match.

See `FEATURES.md`, `ARCHITECTURE.md`, `USER-GUIDE.md` and `BUILD.md` for details.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
npm run preview  # serve the production build
```

Requires Node.js 18+.

## Tech stack

React 19 · TypeScript · Vite 7 · Three.js (WebGL + WebXR) · no backend required —
the v0.1 data layer is typed local seed data (`src/data/`), ready to be swapped for
SQLite/API persistence (see `ARCHITECTURE.md`).

## Project layout

```
src/
  components/   # layout (sidebar/topbar) + viewer (three.js engine)
  data/         # vehicles, procedures, parts, torque, DTC seed data
  pages/        # dashboard, procedures, viewer, diagnostics, parts, torque
  hooks/        # localStorage persistence, WebXR detection
  styles/       # garage dark theme
  types/        # shared TypeScript models
```

## Data provenance

The EC1/EC3 cylinder-head and timing-cover procedures were reconstructed from workshop
manual pages (see `1.pdf`, `2.pdf`, `head.pdf` in the repo root). Torque values are
representative — always confirm against the OEM manual for the exact VIN before assembly.
