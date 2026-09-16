import { useCallback, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { vehicles } from './data/vehicles';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useVrStatus } from './hooks/useVrStatus';
import { Dashboard } from './pages/Dashboard';
import { Diagnostics } from './pages/Diagnostics';
import { Parts } from './pages/Parts';
import { ProcedureDetail } from './pages/ProcedureDetail';
import { Procedures } from './pages/Procedures';
import { Torque } from './pages/Torque';
import { Vehicles } from './pages/Vehicles';
import { Viewer } from './pages/Viewer';
import { Wiring } from './pages/Wiring';
import type { Route } from './types';
import './styles/global.css';

export default function App() {
  const [route, setRoute] = useState<Route>({ page: 'dashboard' });
  const [history, setHistory] = useState<Route[]>([]);
  const [vehicleId, setVehicleId] = useLocalStorage('vr-garage-vehicle', 'jl-20-ec3');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const vrReady = useVrStatus();

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0];

  const go = useCallback(
    (r: Route) => {
      setHistory((h) => [...h.slice(-24), route]);
      setRoute(r);
      window.scrollTo({ top: 0 });
    },
    [route]
  );

  void history;

  return (
    <div className="app">
      <Sidebar
        route={route}
        go={go}
        open={sidebarOpen}
        close={() => setSidebarOpen(false)}
        vrReady={vrReady}
      />
      <div className={`scrim${sidebarOpen ? ' show' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className="main">
        <TopBar
          go={go}
          vehicleId={vehicle.id}
          setVehicleId={setVehicleId}
          toggleSidebar={() => setSidebarOpen((o) => !o)}
        />
        <main className="content">
          {route.page === 'dashboard' && <Dashboard go={go} vehicle={vehicle} />}
          {route.page === 'vehicles' && (
            <Vehicles go={go} vehicleId={vehicle.id} setVehicleId={setVehicleId} />
          )}
          {route.page === 'procedures' && (
            <Procedures key={route.id ?? 'all'} go={go} initialSystem={route.id} vehicleId={vehicle.id} />
          )}
          {route.page === 'procedure' && route.id && (
            <ProcedureDetail id={route.id} go={go} back={() => go({ page: 'procedures' })} />
          )}
          {route.page === 'parts' && <Parts go={go} highlightId={route.id} />}
          {route.page === 'torque' && <Torque highlightId={route.id} />}
          {route.page === 'diagnostics' && <Diagnostics go={go} initialCode={route.id} />}
          {route.page === 'wiring' && (
            <Wiring key={route.id ?? 'lib'} go={go} initialDocId={route.id} />
          )}
          {route.page === 'viewer' && <Viewer key={route.focusPart ?? 'plain'} focusPart={route.focusPart} />}
        </main>
      </div>
    </div>
  );
}
