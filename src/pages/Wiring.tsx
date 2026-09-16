import { useLocalStorage } from '../hooks/useLocalStorage';

interface Item {
  id: string;
  label: string;
  hint: string;
}
interface Group {
  name: string;
  items: Item[];
}

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

export function Wiring() {
  const [done, setDone] = useLocalStorage<Record<string, boolean>>('vr-garage-wiring-export', {});
  const count = ALL_IDS.filter((id) => done[id]).length;

  const toggle = (id: string) => setDone({ ...done, [id]: !done[id] });

  return (
    <div>
      <h1 className="page-title">Wiring &amp; electrical</h1>
      <p className="page-sub">
        Export the <strong>08 - Electrical</strong> section from Direct-Hit, tick it off here, then
        attach the PDFs in chat — diagrams become a searchable wiring library in this page.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>How to export from Direct-Hit (per article)</h3>
        <ol className="muted" style={{ margin: 0, paddingLeft: 20 }}>
          <li>Log in at <strong>dh.identifix.com</strong> → Service Manuals → your Jeep 2.0L</li>
          <li>Expand <strong>08 - Electrical</strong> in the tree and open an article below</li>
          <li><strong>Ctrl+P → Save as PDF</strong> (name it after the article)</li>
          <li>Tick it off in the checklist, attach the PDFs here when done</li>
        </ol>
        <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>
          {count}/{ALL_IDS.length} exported ({Math.round((count / ALL_IDS.length) * 100)}%)
        </div>
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
                <button className="step-check" onClick={() => toggle(item.id)} title="Mark exported">✓</button>
                <div className="step-body">
                  <div className="step-title">{item.label}</div>
                  <div className="step-detail">{item.hint}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>What gets built from your PDFs</h3>
        <ul className="muted" style={{ margin: 0, paddingLeft: 20 }}>
          <li>Zoomable <strong>wiring diagram viewer</strong> grouped by system</li>
          <li><strong>Connector pinouts</strong> + component location photos</li>
          <li><strong>Ground &amp; splice maps</strong> for no-start / CAN diagnostics</li>
          <li>Electrical <strong>pinpoint tests</strong> linked from DTC codes</li>
        </ul>
      </div>
    </div>
  );
}
