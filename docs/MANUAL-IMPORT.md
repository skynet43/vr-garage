# Manual Import Guide

How a complete workshop manual PDF becomes interactive VR Garage procedures.

## Drop zone

Put the raw manual at `docs/manuals/manual.pdf`. Raw PDFs are **git-ignored**
(they can be hundreds of MB) — only the reviewed, structured output is committed.

## Pipeline (`scripts/ingest-manual.py`)

| Step | Command | Output |
|---|---|---|
| 1. Survey | `--analyze docs/manuals/manual.pdf` | page count, scanned-vs-text %, TOC, heading styles |
| 2. Extract | `--extract … --out database/seed/manual-import` | `pages.json` (text per page) + `figures/` (diagrams) |
| 3. Structure | `--structure …/pages.json --out src/data/procedures.generated.ts` | draft `Procedure[]` for review |

## Text vs scanned matters

- **Text-based PDF** (real OEM files, TechAuthority): fast lane — steps, `Refer to`
  cross-refs, warnings and torque mentions are detected automatically.
- **Print-to-PDF / scanned** (Direct-Hit "Microsoft Print To PDF" output): image-only,
  no text layer. Figures still extract, but step text needs OCR or manual
  transcription before structuring.

Rule of thumb: a text-based manual converts ~10x faster and cleaner.

## QA rules before shipping generated procedures

1. Fix titles, system, difficulty, time and tool lists by hand.
2. Verify every torque value against the manual page — never ship auto-detected torque blind.
3. Link `torqueId` and `parts3d` ids to the real apps data.
4. Confirm engine/vehicle fitment (`engineCodes`, `vehicleIds`).
5. Keep `source` pointing at the manual section + page for traceability.
