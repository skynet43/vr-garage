import { procedures } from '../data/procedures';
import { vehicleName, vehicles } from '../data/vehicles';
import type { Route } from '../types';

interface Props {
  go: (r: Route) => void;
  vehicleId: string;
  setVehicleId: (id: string) => void;
}

export function Vehicles({ go, vehicleId, setVehicleId }: Props) {
  return (
    <div>
      <h1 className="page-title">Vehicles</h1>
      <p className="page-sub">Select the vehicle on the lift — procedures, parts and specs filter to match.</p>
      <div className="grid cols-2">
        {vehicles.map((v) => {
          const active = v.id === vehicleId;
          const count = procedures.filter((p) => p.vehicleIds.includes(v.id)).length;
          return (
            <div key={v.id} className="card" style={active ? { borderColor: 'var(--accent)' } : undefined}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <h3 style={{ marginBottom: 4 }}>{vehicleName(v)}</h3>
                {active && <span className="badge green">Active</span>}
              </div>
              <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
                {v.engine} · {count} procedures
              </div>
              <dl className="kv">
                <dt>Engine code</dt><dd><span className="badge blue mono">{v.engineCode}</span></dd>
                <dt>Displacement</dt><dd>{v.displacement}</dd>
                <dt>Transmission</dt><dd>{v.transmission}</dd>
                <dt>Drivetrain</dt><dd>{v.drivetrain}</dd>
                <dt>eTorque / ESS</dt><dd>{v.etorque ? 'Yes' : 'No'} / {v.ess ? 'Yes' : 'No'}</dd>
              </dl>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {!active && <button className="btn small" onClick={() => setVehicleId(v.id)}>Set active</button>}
                <button className="btn ghost small" onClick={() => { setVehicleId(v.id); go({ page: 'procedures' }); }}>
                  View procedures
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
