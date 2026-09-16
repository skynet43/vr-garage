import { EngineViewer } from '../components/viewer/EngineViewer';

interface Props {
  focusPart?: string;
}

export function Viewer({ focusPart }: Props) {
  return (
    <div>
      <h1 className="page-title">3D engine viewer</h1>
      <p className="page-sub">
        Interactive 2.0L Hurricane (EC1/EC3) — explode the assembly, inspect components, and jump straight to
        the related repair steps. WebXR-ready when a headset is connected.
      </p>
      <EngineViewer focusPart={focusPart} />
    </div>
  );
}
