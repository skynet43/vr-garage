# Diagnostics & OBD

## OBD live (`src/obd/`)

VR Garage talks ELM327 directly to a Bluetooth OBD adapter — the same hardware
JScan uses — so live data and fault codes work with no middleman app.

| File | Role |
|---|---|
| `types.ts` | `ByteTransport` interface, SAE PID table, snapshot types |
| `elm327.ts` | Command serialization, echo/prompt handling, parsers (PIDs, DTCs, VIN), JScan-text code extractor |
| `bluetooth.ts` | Web Bluetooth transport, adapter profiles, auto-detect, custom UUIDs |
| `simulator.ts` | Virtual 2.0L eTorque ECU for demo mode (drifting RPM/speed/temps, demo P0300+P0299) |
| `useObd.ts` | React hook: connect, live polling, DTC read/clear |

## Adapter support

Two hardware paths, both in the OBD Live page:

1. **Web Bluetooth (BLE adapters)** — BLE 4.0+ ELM327 units. Known profiles:
   generic FFE0/FFE1 (Veepeak, iCar 2/3, most clones), Vgate iCar Pro FFF0,
   Nordic UART. Auto-detect probes each until one answers ATZ; manual UUIDs
   for unlisted units.
2. **Web Serial (USB + classic Bluetooth)** — USB ELM327 cables, or classic
   BT/SPP adapters paired in Windows Settings first (pairing creates a COM
   port — pick the *outgoing* one). Baud selectable: 9600–500000, start 38400.

- Browser: Chrome/Edge on Android, Windows or macOS, served over HTTPS.
- Only one app can hold the adapter at a time — close JScan/Torque first.
- **iOS Safari has neither API** — use the JScan import there instead.

## JScan import

JScan exposes no API, but its Advanced Scan can be shared as a file/email
(see JScan docs → data export). Drop that text into the OBD page importer:
P/C/B/U codes are extracted and deep-linked into the Diagnostics library.

## Safety

Mode 04 (clear codes) asks for confirmation and warns that freeze frames and
readiness monitors reset. Diagnose first, clear last.
