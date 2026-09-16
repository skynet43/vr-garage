# Unreal Engine 3D (Pixel Streaming)

The web app's Unreal tab shows a live UE 5.8 stream. UE has no web export —
instead the engine renders on the **shop PC's GPU** and streams video to the
browser via WebRTC (Epic's Pixel Streaming 2). Mouse/keyboard input forwards
back, so orbiting the engine works from any browser tab.

```
Shop PC (Windows, GPU)                    Browser (anywhere)
┌────────────────────────────┐   WebRTC   ┌──────────────────────┐
│ VRGarage UE 5.8 app        │───────────▶│ VR Garage web app    │
│  + GarageBay level         │◀───────────│  Unreal Stream tab   │
│  + PixelStreaming plugin   │  input +   │  mouse/kbd + data    │
└─────────────┬──────────────┘  commands  └──────────────────────┘
              │ ws://127.0.0.1:8888
┌─────────────▼──────────────┐
│ SignallingWebServer (node) │
└────────────────────────────┘
```

## Requirements (shop PC)

- Windows 10/11, discrete GPU (NVIDIA RTX recommended; AMD/Intel with HW encoder OK)
- Unreal Engine **5.8** (match the frontend lib version)
- Node.js 18+ (signalling server), ~2 GB free for the UE project

## Setup

1. Clone the repo on the PC and open `unreal/VRGarage.uproject` (first open
   builds shaders — grab coffee).
2. In the editor: **Tools → Execute Python Script** → pick
   `unreal/Content/Python/build_garage_level.py`. It builds
   `/Game/Garage/Maps/GarageBay`: the 2.0L engine (parts tagged `part:<id>`
   to match the web app), stand, lights and a fly-camera spectator.
   Save All, press Play — WASD + mouse should fly around the engine.
3. Run `unreal/Scripts/Start-Stream.ps1` (starts signalling on port 8888,
   then the game in offscreen streaming mode).
4. In VR Garage: **3D Engine Viewer → Unreal Engine stream → Connect to UE**.

For production, package the project (Windows 64-bit) and run the .exe with
`-PixelStreamingURL=ws://<host>:8888 -RenderOffScreen` instead of `-game` mode.

## Web-side protocol (phase 2)

The player already sends UI-interaction descriptors over the data channel:

```json
{"cmd": "vrg:explode", "value": 0.0}
{"cmd": "vrg:focus", "part": "headGasket"}
{"cmd": "vrg:spin", "on": true}
```

Handle them in UE (a command actor reading Pixel Streaming responses,
replying `vrg:ack`) to drive exploded view / part highlight from the web UI.
Until then, stream + forwarded input (orbit/fly) work out of the box.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Connect hangs | Signalling server not running, or UE app not paired to it — check both windows |
| Black video | GPU encoder busy (close OBS/ShadowPlay) or `-RenderOffScreen` on a headless box without GPU |
| No mouse/keyboard | Click inside the player first (browser gesture policy) |
| Wrong UE version | Lib and engine must match major (5.8 ↔ 5.8); mismatches fail SDP negotiation |
| LAN access | Bind signalling to `0.0.0.0` and open 8888 + ephemeral UDP in the firewall |

## WebGL fallback

The **WebGL model** tab (Three.js) always works offline with the same part
catalog. The Unreal stream is the high-fidelity mode; nothing depends on it.
