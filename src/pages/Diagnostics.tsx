import { useMemo, useState } from 'react';
import { dtcs } from '../data/dtc';
import type { Route } from '../types';

interface Props {
  go: (r: Route) => void;
  initialCode?: string;
}

const SEV = { high: 'High', medium: 'Medium', low: 'Low' } as const;

export function Diagnostics({ go, initialCode }: Props) {
  const [q, setQ] = useState(initialCode ?? '');
  const [open, setOpen] = useState<string | null>(initialCode ?? null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return dtcs;
    return dtcs.filter((d) => `${d.code} ${d.title} ${d.system}`.toLowerCase().includes(s));
  }, [q]);

  return (
    <div>
      <h1 className="page-title">Diagnostics</h1>
      <p className="page-sub">DTC lookup with likely causes and pinpoint fixes for the 2.0L Hurricane platform.</p>
      <div className="filter-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Enter code or symptom — e.g. P0300, underboost…"
          style={{ minWidth: 300 }}
          className="mono"
        />
      </div>
      <div className="grid cols-2">
        {list.map((d) => {
          const isOpen = open === d.code;
          return (
            <div key={d.code} className="card dtc-card" onClick={() => setOpen(isOpen ? null : d.code)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <span className="dtc-code">{d.code}</span>
                <span className={`badge sev-${d.severity}`}>{SEV[d.severity]} severity</span>
              </div>
              <h3 style={{ margin: '6px 0 2px' }}>{d.title}</h3>
              <div className="muted" style={{ fontSize: 12.5 }}>{d.system}</div>
              {isOpen && (
                <div style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                  <p className="muted" style={{ marginTop: 0 }}>{d.description}</p>
                  <strong>Likely causes</strong>
                  <ul className="muted" style={{ marginTop: 4 }}>
                    {d.causes.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                  <strong>Pinpoint fixes</strong>
                  <ul className="muted" style={{ marginTop: 4 }}>
                    {d.fixes.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  {d.procedureIds.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {d.procedureIds.map((pid) => (
                        <button key={pid} className="btn ghost small" onClick={() => go({ page: 'procedure', id: pid })}>
                          Open {pid}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {list.length === 0 && <div className="card muted">No codes match “{q}”.</div>}
    </div>
  );
}
