import { useMemo, useState } from 'react';
import { connectorPinouts, wiringDocs } from '../data/wiring.generated';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Route, WiringDoc } from '../types';

/* ---------------- wire color dots ---------------- */

const WIRE_COLORS: Record<string, string> = {
  WH: '#e8e8e8', BK: '#1c1c1c', GN: '#2faf4f', RD: '#e03232', BU: '#2f6fe0',
  YE: '#f2c618', OG: '#f07d18', VT: '#8e44cc', GY: '#9a9a9a', BN: '#8a5a2b',
  PK: '#f2a0c0', TN: '#d6b98c', LG: '#7fd67f', LB: '#7fc4e8', DB: '#1f3fae',
  DG: '#1d7a3a', BG: '#cfc39a', WT: '#e8e8e8',
};

function ColorDot({ code }: { code: string }) {
  const parts = code.split('/').map((c) => WIRE_COLORS[c] ?? '#666');
  const bg = parts.length > 1
    ? `linear-gradient(135deg, ${parts[0]} 50%, ${parts[1]} 50%)`
    : parts[0];
  return (
    <span
      title={code}
      style={{
        display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
        background: bg, border: '1px solid var(--line)', marginRight: 7, verticalAlign: -2,
      }}
    />
  );
}

/* ---------------- export checklist (kept for tracking future drops) ---------------- */

interface Item { id: string; label: string; hint: string }
interface Group { name: string; items: Item[] }

const GROUPS: Group[] = [
  {
    name: 'Power & ground distribution',
    items: [
      { id: 'batt', label: 'Battery, IBS & cables', hint: '08 - Electrical / Battery System' },
      { id: 'pdc', label: 'Power distribution / fuse boxes', hint: 'Print every PDC layout + fuse chart' },
      { id: 'grounds', label: 'Ground locations', hint: 'All G100/G200… eyelet maps + photos' },
      { id: 'splices', label: 'Splice locations', hint: 'Wire splice pack locations' },
    ],
  },
  {
    name: 'Charging, starting & eTorque',
    items: [
      { id: 'ess', label: 'ESS dual-battery / generator', hint: '08 - Electrical / Charging' },
      { id: 'etorque', label: 'eTorque 48V system + MGU', hint: '48V battery, DC-DC converter, MGU circuits' },
      { id: 'starter', label: 'Starting system', hint: 'Starter circuits + relay control' },
    ],
  },
  {
    name: 'Engine controls & network',
    items: [
      { id: 'ecm', label: 'ECM connectors & pinouts', hint: 'Every ECM connector face + pin table' },
      { id: 'can', label: 'CAN bus network topology', hint: 'CAN-C / CAN-IH network + DLC connector' },
      { id: 'sensors', label: 'Engine sensors', hint: 'TMAP, cam/crank, EGR temp, pressure sensors' },
      { id: 'ignfuel', label: 'Ignition & fuel injection', hint: 'Coils, injectors, fuel pump control' },
    ],
  },
  {
    name: 'Chassis & body',
    items: [
      { id: 'abs', label: 'ABS / ESP + wheel speed', hint: 'Module connectors + sensor circuits' },
      { id: 'eps', label: 'Electric power steering', hint: 'EPS module power + CAN' },
      { id: 'light', label: 'Lighting', hint: 'Exterior + interior lamp circuits' },
      { id: 'hvac', label: 'HVAC controls', hint: 'Blower, compressor clutch request, sensors' },
      { id: 'cluster', label: 'Cluster & infotainment', hint: 'IPC, radio, antenna, USB/aux' },
    ],
  },
  {
    name: 'Diagnostics & repair',
    items: [
      { id: 'dtc', label: 'Electrical DTC diagnostics', hint: 'U-codes + B-codes pinpoint tests' },
      { id: 'connrepair', label: 'Connector & terminal repair', hint: 'Terminal release, crimp, seal procedures' },
      { id: 'comps', label: 'Component locations', hint: 'Module/sensor location photos' },
    ],
  },
];

const ALL_IDS = GROUPS.flatMap((g) => g.items.map((i) => i.id));

/* ---------------- library ---------------- */

const CATEGORIES = ['All', ...[...new Set(wiringDocs.map((d) => d.category))].sort()];

function DocDetail({ doc, go }: { doc: WiringDoc; go: (r: Route) => void }) {
  const [page, setPage] = useState(1);
  const pinout = connectorPinouts.find((p) => p.id === doc.id);
  const [pinQ, setPinQ] = useState('');

  const pins = useMemo(() => {
    if (!pinout) return [];
    const s = pinQ.trim().toLowerCase();
    if (!s) return pinout.pins;
    return pinout.pins.filter((p) =>
      `${p.pin} ${p.circuit} ${p.color} ${p.function} ${p.option}`.toLowerCase().includes(s)
    );
  }, [pinout, pinQ]);

  const meta = pinout?.meta ?? {};
  const metaRows: [string, string][] = [
    ['Connector', meta['name'] ?? '—'],
    ['Connector No', meta['Connector No'] ?? '—'],
    ['Cavities', meta['Cavity Count'] ?? '—'],
    ['Harness', meta['Harness Family'] ?? '—'],
    ['Gender / Color', `${meta['Gender'] ?? '—'} / ${meta['Color'] ?? '—'}`],
    ['Part number', meta['Part Number'] ?? '—'],
    ['Repair kit', meta['Repair Kit Part Number'] ?? '—'],
  ];

  return (
    <div>
      <button className="btn ghost small" onClick={() => go({ page: 'wiring' })}>← Diagram library</button>
      <div className="proc-head" style={{ marginTop: 14 }}>
        <div>
          <h1 className="page-title">{doc.title}</h1>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <span className="badge orange">{doc.category}</span>
            <span className="badge">{doc.pages} page{doc.pages > 1 ? 's' : ''}</span>
            {doc.pinout && <span className="badge green">Pinout table included</span>}
          </div>
        </div>
        <a className="btn ghost" href={`/${doc.file}`} target="_blank" rel="noreferrer">
          Open full PDF
        </a>
      </div>

      <div className="card" style={{ padding: 10 }}>
        {doc.pages > 1 && (
          <div className="tabs" style={{ padding: '6px 6px 0' }}>
            {Array.from({ length: doc.pages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`chip${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>
                Page {p}
              </button>
            ))}
          </div>
        )}
        <iframe
          key={page}
          src={`/${doc.file}#page=${page}`}
          title={`${doc.title} — page ${page}`}
          className="pdf-frame"
        />
        <div className="muted" style={{ fontSize: 12, padding: '6px 8px 2px' }}>
          Use the PDF toolbar to zoom — wire colors and cavity numbers stay sharp at any level.
        </div>
      </div>

      {pinout && (
        <div style={{ marginTop: 16 }}>
          <h2 className="page-title" style={{ fontSize: 18 }}>Connector pinout</h2>
          <div className="grid cols-2" style={{ marginBottom: 14 }}>
            <div className="card">
              <dl className="kv">
                {metaRows.map(([k, v]) => (
                  <div key={k} style={{ display: 'contents' }}>
                    <dt>{k}</dt><dd className={k.includes('number') || k === 'Connector No' ? 'mono' : ''}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="card">
              <h3>Find a pin</h3>
              <div className="filter-row" style={{ marginBottom: 0 }}>
                <input
                  value={pinQ}
                  onChange={(e) => setPinQ(e.target.value)}
                  placeholder="e.g. GROUND, CAN, L54…"
                  style={{ width: '100%' }}
                />
              </div>
              <p className="muted" style={{ fontSize: 12.5 }}>
                {pins.length} of {pinout.pins.length} rows · circuits, colors and gauges as printed.
              </p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Pin</th><th>Circuit</th><th>Wire</th><th>Gauge</th><th>Function</th><th>Option</th></tr>
              </thead>
              <tbody>
                {pins.map((p, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ color: 'var(--accent-2)', fontWeight: 800 }}>{p.pin}</td>
                    <td className="mono">{p.circuit}</td>
                    <td className="mono"><ColorDot code={p.color} />{p.color}</td>
                    <td className="mono">{p.gauge}</td>
                    <td>{p.function}</td>
                    <td className="muted" style={{ fontSize: 12.5 }}>{p.option || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- page ---------------- */

interface Props {
  go: (r: Route) => void;
  initialDocId?: string;
}

export function Wiring({ go, initialDocId }: Props) {
  const [tab, setTab] = useState<'library' | 'checklist'>('library');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [pinoutsOnly, setPinoutsOnly] = useState(false);
  const [done, setDone] = useLocalStorage<Record<string, boolean>>('vr-garage-wiring-export', {});

  const activeDoc = initialDocId ? wiringDocs.find((d) => d.id === initialDocId) : undefined;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return wiringDocs.filter((d) => {
      if (cat !== 'All' && d.category !== cat) return false;
      if (pinoutsOnly && !d.pinout) return false;
      return !s || `${d.title} ${d.category}`.toLowerCase().includes(s);
    });
  }, [q, cat, pinoutsOnly]);

  const count = ALL_IDS.filter((id) => done[id]).length;

  if (activeDoc) {
    return <DocDetail doc={activeDoc} go={go} />;
  }

  return (
    <div>
      <h1 className="page-title">Wiring &amp; electrical</h1>
      <p className="page-sub">
        {wiringDocs.length} diagrams · {wiringDocs.reduce((a, d) => a + d.pages, 0)} pages ·{' '}
        {connectorPinouts.length} searchable pinouts — JL Wrangler factory wiring set.
      </p>

      <div className="tabs">
        <button className={`chip${tab === 'library' ? ' active' : ''}`} onClick={() => setTab('library')}>
          Diagram library ({wiringDocs.length})
        </button>
        <button className={`chip${tab === 'checklist' ? ' active' : ''}`} onClick={() => setTab('checklist')}>
          Export checklist ({count}/{ALL_IDS.length})
        </button>
      </div>

      {tab === 'library' && (
        <>
          <div className="filter-row">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search diagrams…" style={{ minWidth: 220 }} />
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <label className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              <input type="checkbox" checked={pinoutsOnly} onChange={(e) => setPinoutsOnly(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
              Pinouts only
            </label>
          </div>
          <div className="doc-grid">
            {list.map((d) => (
              <div key={d.id} className="card doc-card" onClick={() => go({ page: 'wiring', id: d.id })}>
                <img src={`/${d.thumbs[0]}`} alt={d.title} loading="lazy" />
                <div className="doc-card-body">
                  <h3>{d.title}</h3>
                  <div className="proc-meta">
                    <span className="badge">{d.category}</span>
                    {d.pinout && <span className="badge green">Pinout</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {list.length === 0 && <div className="card muted">No diagrams match these filters.</div>}
        </>
      )}

      {tab === 'checklist' && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>How to export from Direct-Hit (per article)</h3>
            <ol className="muted" style={{ margin: 0, paddingLeft: 20 }}>
              <li>Log in at <strong>dh.identifix.com</strong> → Service Manuals → your Jeep 2.0L</li>
              <li>Expand <strong>08 - Electrical</strong> in the tree and open an article below</li>
              <li><strong>Ctrl+P → Save as PDF</strong> (name it after the article)</li>
              <li>Tick it off here, attach the PDFs in chat when done</li>
            </ol>
            <div className="progress-bar" style={{ marginBottom: 0 }}>
              <i style={{ width: `${(count / ALL_IDS.length) * 100}%` }} />
            </div>
          </div>
          <div className="grid cols-2">
            {GROUPS.map((g) => (
              <div key={g.name} className="card">
                <h3>{g.name}</h3>
                {g.items.map((item) => (
                  <div key={item.id} className={`step${done[item.id] ? ' done' : ''}`}>
                    <button className="step-check" onClick={() => setDone({ ...done, [item.id]: !done[item.id] })} title="Mark exported">✓</button>
                    <div className="step-body">
                      <div className="step-title">{item.label}</div>
                      <div className="step-detail">{item.hint}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
