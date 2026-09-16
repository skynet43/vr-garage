import { useState } from 'react';
import { torqueSpecs } from '../data/torque';

interface Props {
  highlightId?: string;
}

export function Torque({ highlightId }: Props) {
  const [q, setQ] = useState('');

  const list = torqueSpecs.filter((t) => {
    const s = q.trim().toLowerCase();
    return !s || `${t.component} ${t.engine}`.toLowerCase().includes(s);
  });

  return (
    <div>
      <h1 className="page-title">Torque specifications</h1>
      <p className="page-sub">Always tighten in the specified sequence. Torque-to-yield fasteners are one-time use.</p>
      <div className="filter-row">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search component…" style={{ minWidth: 260 }} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Engine</th>
              <th>Tightening steps</th>
              <th>N·m</th>
              <th>ft-lb</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} style={t.id === highlightId ? { background: 'rgba(255,106,0,0.12)' } : undefined}>
                <td><strong>{t.component}</strong></td>
                <td>{t.engine}</td>
                <td className="muted">{t.steps.join(' → ')}</td>
                <td className="mono" style={{ color: 'var(--accent-2)', fontWeight: 800 }}>{t.nm}</td>
                <td className="mono">{t.ftLb}</td>
                <td className="muted" style={{ fontSize: 12.5 }}>{t.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && <div className="card muted" style={{ marginTop: 12 }}>No specs match “{q}”.</div>}
    </div>
  );
}
