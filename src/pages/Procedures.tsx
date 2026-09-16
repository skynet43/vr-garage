import { useMemo, useState } from 'react';
import { procedures } from '../data/procedures';
import type { Route } from '../types';

export function Difficulty({ level }: { level: number }) {
  return (
    <span className="diff-dots" title={`Difficulty ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= level ? 'on' : ''} />
      ))}
    </span>
  );
}

interface Props {
  go: (r: Route) => void;
  initialSystem?: string;
  vehicleId: string;
}

export function Procedures({ go, initialSystem, vehicleId }: Props) {
  const [q, setQ] = useState('');
  const [system, setSystem] = useState(initialSystem ?? 'All');
  const [onlyMine, setOnlyMine] = useState(true);
  const systems = useMemo(() => ['All', ...new Set(procedures.map((p) => p.system))], []);

  const list = procedures.filter((p) => {
    if (onlyMine && !p.vehicleIds.includes(vehicleId)) return false;
    if (system !== 'All' && p.system !== system) return false;
    const s = q.trim().toLowerCase();
    if (s && !`${p.title} ${p.id} ${p.system}`.toLowerCase().includes(s)) return false;
    return true;
  });

  return (
    <div>
      <h1 className="page-title">Repair procedures</h1>
      <p className="page-sub">Factory-style removal &amp; installation with linked 3D components and torque data.</p>

      <div className="filter-row">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter procedures…" style={{ minWidth: 220 }} />
        <select value={system} onChange={(e) => setSystem(e.target.value)}>
          {systems.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
          My vehicle only
        </label>
      </div>

      <div className="grid cols-2">
        {list.map((p) => (
          <div key={p.id} className="card proc-card" onClick={() => go({ page: 'procedure', id: p.id })}>
            <h3>{p.title}</h3>
            <div className="muted" style={{ fontSize: 13 }}>
              {p.system} · {p.removal.length} removal + {p.installation.length} install steps · {p.timeHours} h
            </div>
            <div className="proc-meta">
              <span className="badge orange mono">{p.id}</span>
              {p.engineCodes.map((e) => (
                <span key={e} className="badge">{e}</span>
              ))}
              <Difficulty level={p.difficulty} />
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 && (
        <div className="card muted">No procedures match these filters.</div>
      )}
    </div>
  );
}
