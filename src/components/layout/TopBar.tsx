import { useMemo, useRef, useState } from 'react';
import { dtcs } from '../../data/dtc';
import { parts } from '../../data/parts';
import { procedures } from '../../data/procedures';
import { torqueSpecs } from '../../data/torque';
import { vehicleName, vehicles } from '../../data/vehicles';
import type { Route } from '../../types';
import { ICONS, IconPath } from '../Icon';

interface Props {
  go: (r: Route) => void;
  vehicleId: string;
  setVehicleId: (id: string) => void;
  toggleSidebar: () => void;
}

export function TopBar({ go, vehicleId, setVehicleId, toggleSidebar }: Props) {
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return null;
    return {
      procedures: procedures.filter((p) => `${p.title} ${p.system} ${p.id}`.toLowerCase().includes(s)).slice(0, 4),
      parts: parts.filter((p) => `${p.name} ${p.number}`.toLowerCase().includes(s)).slice(0, 4),
      dtc: dtcs.filter((d) => `${d.code} ${d.title}`.toLowerCase().includes(s)).slice(0, 4),
      torque: torqueSpecs.filter((t) => t.component.toLowerCase().includes(s)).slice(0, 3),
    };
  }, [q]);

  const hasAny =
    results &&
    (results.procedures.length + results.parts.length + results.dtc.length + results.torque.length > 0);

  const jump = (r: Route) => {
    setQ('');
    setFocused(false);
    go(r);
  };

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={toggleSidebar} aria-label="Menu">
        ☰
      </button>
      <div
        className="search-wrap"
        ref={boxRef}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
        }}
      >
        <span className="search-icon">
          <IconPath d={ICONS.search} size={17} />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search procedures, parts, DTCs, torque specs…"
        />
        {focused && results && (
          <div className="search-results">
            {!hasAny && <div className="search-hit muted">No matches for “{q}”.</div>}
            {results.procedures.length > 0 && <div className="search-group">Procedures</div>}
            {results.procedures.map((p) => (
              <button key={p.id} className="search-hit" onMouseDown={() => jump({ page: 'procedure', id: p.id })}>
                {p.title}
                <small>{p.id} · {p.system} · {p.engineCodes.join('/')}</small>
              </button>
            ))}
            {results.dtc.length > 0 && <div className="search-group">Diagnostic codes</div>}
            {results.dtc.map((d) => (
              <button key={d.code} className="search-hit" onMouseDown={() => jump({ page: 'diagnostics', id: d.code })}>
                {d.code} — {d.title}
                <small>{d.system}</small>
              </button>
            ))}
            {results.parts.length > 0 && <div className="search-group">Parts</div>}
            {results.parts.map((p) => (
              <button key={p.id} className="search-hit" onMouseDown={() => jump({ page: 'parts', id: p.id })}>
                {p.name}
                <small className="mono">{p.number} · ${p.price.toFixed(2)}</small>
              </button>
            ))}
            {results.torque.length > 0 && <div className="search-group">Torque</div>}
            {results.torque.map((t) => (
              <button key={t.id} className="search-hit" onMouseDown={() => jump({ page: 'torque', id: t.id })}>
                {t.component}
                <small>{t.nm} N·m · {t.ftLb} ft-lb</small>
              </button>
            ))}
          </div>
        )}
      </div>
      <select className="vehicle-select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} title="Active vehicle">
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {vehicleName(v)} · {v.engineCode}
          </option>
        ))}
      </select>
    </header>
  );
}
