import type { PageId, Route } from '../../types';
import { ICONS, IconPath } from '../Icon';

interface Props {
  route: Route;
  go: (r: Route) => void;
  open: boolean;
  close: () => void;
  vrReady: boolean;
}

const NAV: { page: PageId; label: string; icon: string }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard },
  { page: 'viewer', label: '3D Engine Viewer', icon: ICONS.cube },
  { page: 'procedures', label: 'Repair Procedures', icon: ICONS.wrench },
  { page: 'diagnostics', label: 'Diagnostics', icon: ICONS.pulse },
  { page: 'wiring', label: 'Wiring & Electrical', icon: ICONS.bolt },
  { page: 'obd', label: 'OBD Live', icon: ICONS.radio },
  { page: 'vehicles', label: 'Vehicles', icon: ICONS.car },
  { page: 'parts', label: 'Parts Database', icon: ICONS.box },
  { page: 'torque', label: 'Torque Specs', icon: ICONS.gauge },
];

export function Sidebar({ route, go, open, close, vrReady }: Props) {
  const active = (p: PageId) =>
    route.page === p || (p === 'procedures' && route.page === 'procedure');

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7z" />
          </svg>
        </div>
        <div>
          <div className="brand-name">
            VR <span>GARAGE</span>
          </div>
          <div className="brand-sub">Repair Platform</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-label">Workshop</div>
        {NAV.slice(0, 6).map((n) => (
          <button
            key={n.page}
            className={`nav-item${active(n.page) ? ' active' : ''}`}
            onClick={() => {
              go({ page: n.page });
              close();
            }}
          >
            <IconPath d={n.icon} />
            {n.label}
          </button>
        ))}
        <div className="nav-label">Reference</div>
        {NAV.slice(6).map((n) => (
          <button
            key={n.page}
            className={`nav-item${active(n.page) ? ' active' : ''}`}
            onClick={() => {
              go({ page: n.page });
              close();
            }}
          >
            <IconPath d={n.icon} />
            {n.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        v0.1.0 · EC1/EC3 data pack
        <br />
        <span className={`vr-pill${vrReady ? ' ready' : ''}`}>
          <span className="dot" />
          {vrReady ? 'VR headset ready' : 'VR not detected'}
        </span>
      </div>
    </aside>
  );
}
