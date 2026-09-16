#!/usr/bin/env python3
"""
VR Garage — service manual ingestion pipeline.

Takes a complete OEM / Direct-Hit workshop manual PDF and slices it into
structured repair procedures the app can consume.

Usage:
    # 1. Survey the file (page count, scanned-vs-text, TOC, heading styles)
    python3 scripts/ingest-manual.py --analyze docs/manuals/manual.pdf

    # 2. Dump page text + extract figures (images) for review/transcription
    python3 scripts/ingest-manual.py --extract docs/manuals/manual.pdf --out database/seed/manual-import

    # 3. Auto-structure detected jobs into app-ready Procedure JSON/TS
    python3 scripts/ingest-manual.py --structure database/seed/manual-import/pages.json \
        --out src/data/procedures.generated.ts

Modes 1-2 are fully automatic. Mode 3 produces a draft that a human (or the
agent) reviews before it ships — torque values and safety notes always get
a manual QA pass.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys

try:
    import pymupdf  # PyMuPDF
except ImportError:
    sys.exit("PyMuPDF required: pip install pymupdf")

# ---------------------------------------------------------------- patterns

RE_STEP = re.compile(r"^\s*(\d{1,3})[\.\)]\s+(.*)$")
RE_REFER = re.compile(r"\(?\s*Refer to (.+?)\)?\s*$", re.IGNORECASE)
RE_HEADING_RI = re.compile(r"removal\s+and\s+installation", re.IGNORECASE)
RE_REMOVAL = re.compile(r"^\s*removal\s*$", re.IGNORECASE)
RE_INSTALL = re.compile(r"^\s*installation\s*$", re.IGNORECASE)
RE_WARN = re.compile(r"^\s*(warning|caution|note)\b\s*[:\-]?\s*(.*)$", re.IGNORECASE)
RE_TORQUE = re.compile(r"(\d+(?:\.\d+)?)\s*(N·m|Nm|ft\.?-?lb|in\.?-?lb)", re.IGNORECASE)
RE_SPECIAL_TOOLS = re.compile(r"special tools?", re.IGNORECASE)


# ---------------------------------------------------------------- analyze

def analyze(pdf_path: str) -> dict:
    doc = pymupdf.open(pdf_path)
    pages = len(doc)
    text_chars = 0
    scanned = 0
    img_count = 0
    fonts: dict[str, int] = {}
    for i, page in enumerate(doc):
        t = page.get_text("text") or ""
        text_chars += len(t.strip())
        if len(t.strip()) < 120:
            scanned += 1
        img_count += len(page.get_images(full=True))
        if i < 25:  # sample heading styles from first pages
            for b in page.get_text("dict").get("blocks", []):
                for line in b.get("lines", []):
                    for span in line.get("spans", []):
                        key = f"{span['font']}|{round(span['size'], 1)}|{span['flags']}"
                        fonts[key] = fonts.get(key, 0) + len(span["text"].strip())
    toc = doc.get_toc(simple=True)
    return {
        "file": pdf_path,
        "pages": pages,
        "metadata": doc.metadata,
        "toc_entries": len(toc),
        "toc_sample": toc[:15],
        "avg_chars_per_page": round(text_chars / max(pages, 1)),
        "scanned_pages": scanned,
        "scanned_pct": round(100 * scanned / max(pages, 1), 1),
        "embedded_images": img_count,
        "top_fonts": sorted(fonts.items(), key=lambda kv: -kv[1])[:12],
    }


# ---------------------------------------------------------------- extract

def page_record(page: pymupdf.Page, pno: int, fig_dir: str) -> dict:
    """Text lines (in reading order) + extracted figures for one page."""
    text = page.get_text("text") or ""
    lines = [ln.strip() for ln in text.splitlines()]
    lines = [ln for ln in lines if ln]

    figs = []
    for idx, img in enumerate(page.get_images(full=True)):
        xref = img[0]
        try:
            pix = pymupdf.Pixmap(page.parent, xref)
        except Exception:
            continue
        if pix.width < 120 or pix.height < 120:
            continue  # skip icons/logos
        name = f"p{pno:04d}_f{idx:02d}.png"
        path = os.path.join(fig_dir, name)
        try:
            if pix.n - pix.alpha > 3:  # CMYK -> RGB
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            pix.save(path)
            figs.append({"file": name, "w": pix.width, "h": pix.height})
        except Exception:
            continue

    # fallback: image-only page -> render the whole page so OCR/vision can read it
    if len("".join(lines)) < 120 and not figs:
        name = f"p{pno:04d}_full.png"
        page.get_pixmap(dpi=150).save(os.path.join(fig_dir, name))
        figs.append({"file": name, "full_page": True})

    return {"page": pno, "lines": lines, "figures": figs}


def extract(pdf_path: str, out_dir: str) -> dict:
    doc = pymupdf.open(pdf_path)
    fig_dir = os.path.join(out_dir, "figures")
    os.makedirs(fig_dir, exist_ok=True)
    pages = [page_record(p, i + 1, fig_dir) for i, p in enumerate(doc)]
    out = {"source": os.path.basename(pdf_path), "pages": len(doc), "records": pages}
    with open(os.path.join(out_dir, "pages.json"), "w") as f:
        json.dump(out, f, indent=1)
    return {"pages": len(doc), "out": out_dir}


# ---------------------------------------------------------------- structure

def structure(pages_json: str) -> list[dict]:
    """
    Best-effort pass: split dumped pages into job drafts.
    A new job starts at a REMOVAL AND INSTALLATION heading; REMOVAL /
    INSTALLATION subheads flip the section; numbered lines become steps.
    The result is a DRAFT for human review, not shippable data.
    """
    with open(pages_json) as f:
        data = json.load(f)

    jobs: list[dict] = []
    current: dict | None = None
    section: str | None = None
    pending_title: str | None = None

    def new_job(title: str, page: int):
        nonlocal current, section
        current = {
            "title_draft": title, "start_page": page,
            "removal": [], "installation": [],
            "warnings": [], "references": [],
            "figures": [],
        }
        jobs.append(current)
        section = "removal"

    for rec in data["records"]:
        for fig in rec["figures"]:
            if current is not None:
                current["figures"].append(f"p{rec['page']:04d}/{fig['file']}")
        for ln in rec["lines"]:
            if RE_HEADING_RI.search(ln):
                new_job(pending_title or f"Job at page {rec['page']}", rec["page"])
                continue
            if current is None:
                if len(ln) > 8 and len(ln) < 110 and not RE_STEP.match(ln):
                    pending_title = ln  # last decent line before heading = title guess
                continue
            if RE_REMOVAL.match(ln):
                section = "removal"
                continue
            if RE_INSTALL.match(ln):
                section = "installation"
                continue
            m = RE_WARN.match(ln)
            if m and m.group(1).lower() in ("warning", "caution"):
                current["warnings"].append(ln)
                continue
            m = RE_STEP.match(ln)
            if m and section:
                ref = None
                rm = RE_REFER.search(m.group(2))
                if rm:
                    ref = rm.group(1)
                    current["references"].append(ref)
                current[section].append({
                    "n": int(m.group(1)), "title": m.group(2)[:300],
                    "reference": ref,
                    "torque_mentions": [f"{a} {b}" for a, b in RE_TORQUE.findall(m.group(2))],
                })
                continue
    return jobs


TS_HEADER = """// AUTO-GENERATED DRAFT from the service manual import.
// Review every job before shipping: fix titles, tools, safety notes,
// torque links (torqueId), 3D part links (parts3d) and vehicle/engine fitment.
// Source: %SOURCE%
import type { Procedure } from '../types';

export const generatedProcedures: Procedure[] = %JSON%;
"""

def jobs_to_ts(jobs: list[dict], source: str) -> str:
    procs = []
    for i, j in enumerate(jobs, 1):
        procs.append({
            "id": f"PROC-GEN-{i:03d}",
            "title": j["title_draft"],
            "system": "Imported",
            "engineCodes": ["EC1", "EC3"],
            "vehicleIds": ["jl-20-ec1", "jl-20-ec3", "kl-20-ec1", "wl-20-ec3"],
            "difficulty": 3,
            "timeHours": 0,
            "tools": [],
            "safety": j["warnings"],
            "removal": j["removal"],
            "installation": j["installation"],
            "tips": [],
            "source": f"Draft import, source pages from {source}",
        })
    return TS_HEADER.replace("%SOURCE%", source).replace("%JSON%", json.dumps(procs, indent=2))


# ---------------------------------------------------------------- cli

def main() -> None:
    ap = argparse.ArgumentParser(description="VR Garage manual ingestion")
    ap.add_argument("--analyze", metavar="PDF", help="survey a manual PDF and print a report")
    ap.add_argument("--extract", metavar="PDF", help="dump page text + figures from a manual PDF")
    ap.add_argument("--structure", metavar="PAGES_JSON", help="auto-structure dumped pages into job drafts")
    ap.add_argument("--out", default="database/seed/manual-import", help="output dir (extract) or .ts file (structure)")
    args = ap.parse_args()

    if args.analyze:
        print(json.dumps(analyze(args.analyze), indent=2))
    elif args.extract:
        print(json.dumps(extract(args.extract, args.out), indent=2))
    elif args.structure:
        jobs = structure(args.structure)
        print(json.dumps({"jobs_detected": len(jobs)}, indent=2))
        for j in jobs[:30]:
            print(f"  - {j['title_draft'][:70]}  (p{j['start_page']}, R:{len(j['removal'])} I:{len(j['installation'])})")
        if args.out.endswith(".ts"):
            with open(args.out, "w") as f:
                f.write(jobs_to_ts(jobs, os.path.basename(args.structure)))
            print(f"wrote {args.out}")
        else:
            os.makedirs(args.out, exist_ok=True)
            with open(os.path.join(args.out, "jobs.draft.json"), "w") as f:
                json.dump(jobs, f, indent=1)
            print(f"wrote {args.out}/jobs.draft.json")
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
