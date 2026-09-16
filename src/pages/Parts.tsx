import { useState } from 'react';
import { parts } from '../data/parts';
import type { Route } from '../types';

interface Props {
  go: (r: Route) => void;
  highlightId?: string;
}

export function Parts({ go, highlightId }: Props) {
  const [q, setQ] = useState('');

  const list = parts.filter((p) => {
    const s = q.trim().toLowerCase();
    return !s || `${p.name} ${p.number} ${p.system}`.toLowerCase().includes(s);
  });

  return (
    <div>
      <h1 className="page-title">Parts database</h1>
      <p className="page-sub">{parts.length} parts stocked for the EC1/EC3 platform. Click a row for torque data.</p>
      <div className="filter-row">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, number, system…" style={{ minWidth: 260 }} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Part</th>
              <th>Part number</th>
              <th>System</th>
              <th>Engines</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Bin</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr
                key={p.id}
                style={p.id === highlightId ? { background: 'rgba(255,106,0,0.12)' } : undefined}
                onClick={() => p.torqueId && go({ page: 'torque', id: p.torqueId })}
              >
                <td><strong>{p.name}</strong></td>
                <td className="mono">{p.number}</td>
                <td>{p.system}</td>
                <td>{p.engineCodes.join(' / ')}</td>
                <td>${p.price.toFixed(2)}</td>
                <td>
                  <span className={`badge ${p.stock <= 4 ? 'red' : p.stock <= 8 ? 'yellow' : 'green'}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="mono">{p.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && <div className="card muted" style={{ marginTop: 12 }}>No parts match “{q}”.</div>}
    </div>
  );
}
