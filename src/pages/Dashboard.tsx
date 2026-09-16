import { dtcs } from '../data/dtc';
import { parts } from '../data/parts';
import { procedures } from '../data/procedures';
import { vehicleName, vehicles } from '../data/vehicles';
import type { Route, Vehicle } from '../types';
import { Difficulty } from './Procedures';

interface Props {
  go: (r: Route) => void;
  vehicle: Vehicle;
}

export function Dashboard({ go, vehicle }: Props) {
  const systems = [...new Set(procedures.map((p) => p.system))];

  return (
    <div>
      <div className="hero">
        <div>
          <h1>
            Fix it right, <span>see it in 3D.</span>
          </h1>
          <p>
            VR Garage pairs step-by-step factory-style procedures with an interactive 3D engine.
            Working on: <strong style={{ color: 'var(--text)' }}>{vehicleName(vehicle)} · {vehicle.engineCode}</strong>
          </p>
          <div className="hero-actions">
            <button className="btn" onClick={() => go({ page: 'viewer' })}>Open 3D engine</button>
            <button className="btn ghost" onClick={() => go({ page: 'procedure', id: 'PROC-HG-20T' })}>
              Head gasket job (EC1/EC3)
            </button>
          </div>
        </div>
        <div className="grid cols-2" style={{ minWidth: 260 }}>
          <div className="stat"><div className="num">{procedures.length}</div><div className="lbl">Procedures</div></div>
          <div className="stat"><div className="num">{parts.length}</div><div className="lbl">Parts</div></div>
          <div className="stat"><div className="num">{dtcs.length}</div><div className="lbl">DTCs</div></div>
          <div className="stat"><div className="num">{vehicles.length}</div><div className="lbl">Vehicles</div></div>
        </div>
      </div>

      <h2 className="page-title" style={{ fontSize: 18 }}>Featured procedures — {vehicle.engineCode}</h2>
      <p className="page-sub">Matched to your active vehicle, including eTorque/ESS variants.</p>
      <div className="grid cols-3" style={{ marginBottom: 24 }}>
        {procedures
          .filter((p) => p.vehicleIds.includes(vehicle.id))
          .slice(0, 3)
          .map((p) => (
            <div key={p.id} className="card proc-card" onClick={() => go({ page: 'procedure', id: p.id })}>
              <h3>{p.title}</h3>
              <div className="muted" style={{ fontSize: 13 }}>
                {p.removal.length + p.installation.length} steps · {p.timeHours} h · {p.system}
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

      <div className="grid cols-2">
        <div className="card">
          <h3>Browse by system</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {systems.map((s) => (
              <button key={s} className="chip" onClick={() => go({ page: 'procedures', id: s })}>
                {s} ({procedures.filter((p) => p.system === s).length})
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Shop shortcuts</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn ghost small" onClick={() => go({ page: 'torque' })}>Torque specs</button>
            <button className="btn ghost small" onClick={() => go({ page: 'diagnostics' })}>Decode a DTC</button>
            <button className="btn ghost small" onClick={() => go({ page: 'parts' })}>Look up a part</button>
            <button className="btn ghost small" onClick={() => go({ page: 'vehicles' })}>Change vehicle</button>
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 0 }}>
            Tip: any procedure step with a “3D” button jumps straight to that component in the viewer.
          </p>
        </div>
      </div>
    </div>
  );
}
