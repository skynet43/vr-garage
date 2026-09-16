# Wiring & Electrical Library

## Contents

74 factory wiring diagrams (81 pages) for the JL Wrangler platform, served from
`public/manuals/wiring/` and browsable in the app's **Wiring & Electrical** page:

- Full-system schematics grouped in 9 categories (network, power, lighting, …)
- Embedded PDF viewer with per-page navigation and native zoom
- 9 searchable **connector pinouts** (pin, circuit, wire color, gauge, function, option)
- Global search integration

## Regenerating

The catalog, thumbnails and pinouts are generated — never hand-edit
`src/data/wiring.generated.ts`:

```bash
# drop new PDFs in public/manuals/wiring/, then:
python3 scripts/build-wiring-library.py
```

The script renders page thumbnails to `public/figures/wiring/`, derives titles and
categories from filenames, and parses `connector-details` / `inline-details` PDFs
into structured pin tables (standard and inline column layouts supported).

## Provenance

Diagrams are the JL Wrangler factory wiring set (Chrysler wiring diagrams,
Nov 2018 revision). Connector metadata references `wiring.dcctools.com`.
Always confirm wire colors against the vehicle before cutting — mid-year
running changes happen.
