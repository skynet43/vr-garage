# Architecture

## Overview

VR Garage v0.1 is a **client-only single-page app**. All domain data lives in typed
TypeScript modules; all persistence is `localStorage`. This keeps the MVP deployable
anywhere (static host, Electron shell, headset browser) while the storage backend is built.

```
┌─────────────────────────────────────────────────────────┐
│  React 19 SPA (Vite)                                    │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Pages   │→ │ Components   │→ │  Three.js Engine  │  │
│  │ (routes) │  │ layout/viewer│  │  (WebGL + WebXR)  │  │
│  └──────────┘  └──────────────┘  └───────────────────┘  │
│         ↓                  ↓                 ↓          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Data layer: src/data/*.ts (seed)                │  │
│  │  vehicles · procedures · parts · torque · dtc    │  │
│  │  Models: src/types  ·  Persist: localStorage     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Key design decisions

- **State-based routing** (`Route` type in `src/types`) instead of react-router — the app
  is a tool, not a document site; deep links are not required for v0.1.
- **Procedure steps link to 3D parts** via `parts3d: string[]` ids that match `PART_META`
  keys in `EngineViewer.tsx`. The link is one-directional data → viewer on purpose.
- **Procedural engine model** (`buildEngine()`): no binary GLB assets to host or license.
  Each assembly is a `THREE.Group` with a base position + explode vector, so the exploded
  view is a pure function of the slider value.
- **Single render loop** via `renderer.setAnimationLoop` so the same path serves the
  monitor view and immersive WebXR sessions.
- **Strict TypeScript** with `tsc --noEmit` gating `npm run build`.

## Roadmap (technical)

1. Extract the data layer behind a repository interface (`src/store/`) with SQLite
   (Electron) and REST (hosted) implementations.
2. Replace procedural geometry with scanned/PBR engine assets loaded as GLB + Draco.
3. Add procedure authoring (Markdown import → steps) and PDF export for job cards.
4. Multi-user sync: job assignments, progress, notes via WebSocket service.
5. Native VR interactions: grab parts, teleport around the bay (three.js XR controllers).
