#!/usr/bin/env python3
"""
Builds the app-ready wiring library from the PDFs in public/manuals/wiring/.

Outputs:
  - public/figures/wiring/<slug>-p<n>.jpg   page thumbnails (gallery)
  - src/data/wiring.generated.ts             catalog + connector pinouts

Re-run any time PDFs are added/changed:
    python3 scripts/build-wiring-library.py
"""
from __future__ import annotations

import json
import os
import re
import sys

try:
    import pymupdf
except ImportError:
    sys.exit("PyMuPDF required: pip install pymupdf")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.path.join(ROOT, "public", "manuals", "wiring")
FIG_DIR = os.path.join(ROOT, "public", "figures", "wiring")
TS_OUT = os.path.join(ROOT, "src", "data", "wiring.generated.ts")

CATEGORIES: list[tuple[str, list[str]]] = [
    ("Connectors & Grounds", ["CONNECTOR-MAP", "GROUND", "connector-details", "inline-details"]),
    ("Network & Data", ["CAN-", "LIN-BUS", "DATA-LINK", "MESSAGE"]),
    ("Power Distribution", ["FUSES", "POWER-DISTRIBUTION", "BODY-CONTROL-LAYOUT"]),
    ("Starting & Charging", ["STARTING_CHARGING"]),
    ("Lighting & Horns", ["LAMP", "LIGHTING", "HEADLAMPS", "FOG", "DEFOGGER", "TURN-SIGNAL", "STOP-LAMPS", "HORNS"]),
    ("Chassis & Drivetrain", ["BRAKE", "EHPS", "TRANSFER-CASE", "TRANSMISSION", "TPM", "SWAY-BAR", "AXLE-LOCKER", "TRAILER-TOW"]),
    ("Locks & Security", ["LOCK", "SWINGGATE", "THEFT-SECURITY", "REMOTE-START", "UNIVERSAL-TRANSMITTER"]),
    ("Comfort & Body", ["HVAC", "CABIN-HEATER", "HEATED", "POWER-OUTLETS", "POWER-TOP", "WINDOWS", "WIPER", "MIRROR", "UPFITTERS"]),
    ("Infotainment & Safety", ["AUDIO", "CAMERA", "BLIND-SPOT", "DIGITAL-TV", "EMERGENCY-RESPONSE", "HANDS-FREE", "MEDIA-PORT", "RESTRAINT"]),
]

ACRONYMS = {"can", "lin", "dlc", "pdc", "ecm", "tpm", "hvac", "atc", "ess", "ihs", "asd",
            "usb", "aux", "ipc", "eps", "ehps", "abs", "esp", "tpms", "drl", "led", "tv",
            "bcm", "rf", "sw", "ac", "dc", "acc"}

TITLE_FIXES = (("Back Up", "Backup"), ("Starting Charging System", "Starting & Charging System"))

def slugify(name: str) -> str:
    s = name.lower().replace(".pdf", "")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return re.sub(r"-{2,}", "-", s)

def prettify(name: str) -> str:
    s = name.replace(".pdf", "").replace("---", " | ").replace("___", " ").replace("__", " ")
    s = s.replace("_", " ").replace("-", " ")
    s = re.sub(r"\s+", " ", s).strip()
    words = []
    for w in s.split(" "):
        if w == "|":
            words.append("—")
            continue
        m = re.match(r"^(\()?([A-Za-z0-9/\.]+)(\)?)$", w)
        if not m:
            words.append(w)
            continue
        pre, core, post = (g or "" for g in m.groups())
        if re.fullmatch(r"\d+\.\d*[A-Za-z]?", core):
            fixed = core[:-1] + core[-1].upper() if core[-1].isalpha() else core
        elif core.lower() in ACRONYMS:
            fixed = core.upper()
        elif core.lower() == "etorque":
            fixed = "eTorque"
        elif any(c.isdigit() for c in core) and core.isupper():
            fixed = core.upper()  # 850RE, C1, XY101A...
        else:
            fixed = core.capitalize()
        words.append(f"{pre}{fixed}{post}")
    t = " ".join(words)
    for a, b in TITLE_FIXES:
        t = t.replace(a, b)
    return t

def categorize(name: str) -> str:
    for cat, keys in CATEGORIES:
        if any(k.lower() in name.lower() for k in keys):
            return cat
    return "Other"

# ------------------------------------------------------------- pin parsing

RE_PIN = re.compile(r"^\d{1,2}$")
RE_CIRCUIT = re.compile(r"^[A-Z]\d{1,4}[A-Z]{0,2}$")
RE_COLOR = re.compile(r"^[A-Z]{2}(/[A-Z]{2})?$")
RE_COLOR_LOOSE = re.compile(r"^([A-Z]{2}\s*/\s*)?[A-Z]{2}$|^NA$")
RE_GAUGE = re.compile(r"^0\.\d+$")
RE_GAUGE_LOOSE = re.compile(r"^\d+(\.\d+)?$")
OPTION_WORDS = ("BASE", "PREMIUM", "EXPORT", "EXCEPT", "LIGHTING", "STANDARD", "OPTION")
HEADER_WORDS = {"Pin", "Circuit", "Wire Color", "Gauge/Size", "Function", "Option",
                "Harness Family", "Circuit Functions", "Color"}

def is_junk(ln: str) -> bool:
    return (ln in HEADER_WORDS or ln.startswith("Page ") or ln.startswith("Chrysler")
            or ln.startswith("http") or ln == "Available Views:" or ln == "Location View")

def parse_pin_table(text: str) -> list[dict]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    try:
        start = lines.index("Option") + 1  # header ends at Option column
    except ValueError:
        return []
    inline = "Harness Family" in lines[max(0, start - 9):start]
    rows: list[dict] = []
    i = start
    while i < len(lines):
        if not RE_PIN.match(lines[i]):
            i += 1
            continue
        pin = lines[i]
        get = lambda j: lines[j] if j < len(lines) else ""
        if inline:
            # Pin / Harness / Circuit / Function... / Color / Gauge / Option...
            circuit = get(i + 2) if RE_CIRCUIT.match(get(i + 2)) else ""
            if not circuit:
                i += 1
                continue
            j = i + 3
            func_parts: list[str] = []
            while j < len(lines) and not RE_COLOR_LOOSE.match(get(j)) and not RE_PIN.match(get(j)):
                func_parts.append(get(j))
                j += 1
            color = get(j).replace(" ", "") if RE_COLOR_LOOSE.match(get(j)) else ""
            gauge = get(j + 1) if color and RE_GAUGE_LOOSE.match(get(j + 1)) else ""
            k = j + 2 if gauge else j
            opt_parts: list[str] = []
            while k < len(lines) and not RE_PIN.match(get(k)) and not get(k).endswith(":") \
                    and "Connector No" not in get(k) and "Page " not in get(k) and "Chrysler" not in get(k):
                opt_parts.append(get(k))
                k += 1
            rows.append({
                "pin": pin, "circuit": circuit, "color": color, "gauge": gauge,
                "function": " ".join(func_parts), "option": " ".join(opt_parts),
            })
            i = k
            continue
        circuit = get(i + 1) if RE_CIRCUIT.match(get(i + 1)) else ""
        color = get(i + 2) if circuit and (RE_COLOR.match(get(i + 2)) or get(i + 2) == "NA") else ""
        gauge = get(i + 3) if color and RE_GAUGE_LOOSE.match(get(i + 3)) else ""
        if not (circuit and color and gauge):
            i += 1
            continue
        j = i + 4
        func_parts = []
        opt_parts = []
        while j < len(lines) and not RE_PIN.match(lines[j]):
            ln = lines[j]
            if is_junk(ln):
                j += 1
                continue
            if any(w in ln.upper() for w in OPTION_WORDS) and func_parts:
                opt_parts.append(ln)
            elif opt_parts:
                opt_parts.append(ln)
            else:
                func_parts.append(ln)
            j += 1
        rows.append({
            "pin": pin, "circuit": circuit, "color": color, "gauge": gauge,
            "function": " ".join(func_parts),
            "option": " ".join(opt_parts),
        })
        i = j
    return rows

def parse_connector_meta(text: str) -> dict:
    meta: dict[str, str] = {}
    keys = ["Harness Family", "Color", "Gender", "Part Number", "Part Description",
            "Connector No", "Option", "Repair Kit Part Number", "Cavity Count"]
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    name = ""
    for idx, ln in enumerate(lines):
        if ln.endswith(":"):
            key = ln[:-1]
            if key in keys and idx + 1 < len(lines):
                meta[key] = lines[idx + 1]
        elif idx > 0 and lines[idx - 1] in ("Isometric View:", "Wire Insertion Side:") and not name:
            pass
    # connector name = first ALL-CAPS line with a dash
    for ln in lines:
        if re.match(r"^[A-Z0-9][A-Z0-9 \-()/]{4,}$", ln) and "-" in ln and ":" not in ln:
            name = ln
            break
    meta["name"] = name
    return meta

# ------------------------------------------------------------------ build

def main() -> None:
    os.makedirs(FIG_DIR, exist_ok=True)
    pdfs = sorted(f for f in os.listdir(PDF_DIR) if f.lower().endswith(".pdf"))
    catalog, pinouts = [], []
    total_pages = 0
    for f in pdfs:
        doc = pymupdf.open(os.path.join(PDF_DIR, f))
        slug = slugify(f)
        thumbs = []
        for n, page in enumerate(doc, 1):
            pix = page.get_pixmap(dpi=55)  # ~640px wide thumb
            out = os.path.join(FIG_DIR, f"{slug}-p{n}.jpg")
            pix.save(out, jpg_quality=65)
            thumbs.append(f"figures/wiring/{slug}-p{n}.jpg")
        total_pages += len(doc)
        entry = {
            "id": slug, "title": prettify(f), "category": categorize(f),
            "file": f"manuals/wiring/{f}", "pages": len(doc), "thumbs": thumbs,
        }
        catalog.append(entry)
        if "connector-details" in f.lower() or "inline-details" in f.lower():
            full_text = "\n".join((p.get_text("text") or "") for p in doc)
            pins = parse_pin_table(full_text)
            if pins:
                entry["pinout"] = True
                pinouts.append({"id": slug, "meta": parse_connector_meta(full_text), "pins": pins})
        doc.close()
        print(f"{entry['pages']}p {f} -> {slug} [{entry['category']}]")

    ts = (
        "// AUTO-GENERATED by scripts/build-wiring-library.py — do not hand-edit.\n"
        "import type { WiringDoc, ConnectorPinout } from '../types';\n\n"
        f"export const wiringDocs: WiringDoc[] = {json.dumps(catalog, indent=2)};\n\n"
        f"export const connectorPinouts: ConnectorPinout[] = {json.dumps(pinouts, indent=2)};\n"
    )
    with open(TS_OUT, "w") as fh:
        fh.write(ts)
    print(f"\nwrote {TS_OUT}: {len(catalog)} docs, {total_pages} pages, {len(pinouts)} pinouts")


if __name__ == "__main__":
    main()
