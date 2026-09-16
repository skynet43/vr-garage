# Build & Run

## Prerequisites

- Node.js 18+ (tested on Node 22)
- npm 9+

## Commands

```bash
npm install     # install dependencies
npm run dev     # dev server on http://localhost:5173 (binds 0.0.0.0)
npm run build   # type-check (tsc --noEmit) + production build to dist/
npm run preview # serve dist/ on http://localhost:4173
```

## Notes

- `vite.config.ts` binds `0.0.0.0` and allow-lists the hosted preview domain so the
  live preview works out of the box.
- Production bundle is a static site (`dist/`) — host it anywhere, wrap it in Electron,
  or sideload it to a headset browser for WebXR.
- WebXR: the **Enter VR** button appears only when `navigator.xr` reports an
  `immersive-vr` session as supported (headset + HTTPS/localhost).
