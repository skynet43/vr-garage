import { useState } from 'react';
import { EngineViewer } from '../components/viewer/EngineViewer';
import { PixelStreamView } from '../unreal/PixelStreamView';

interface Props {
  focusPart?: string;
}

export function Viewer({ focusPart }: Props) {
  const [mode, setMode] = useState<'webgl' | 'unreal'>('webgl');

  return (
    <div>
      <h1 className="page-title">3D engine viewer</h1>
      <p className="page-sub">
        Interactive 2.0L Hurricane (EC1/EC3) — explode the assembly, inspect components, and jump straight to
        the related repair steps. WebXR-ready when a headset is connected.
      </p>
      <div className="tabs">
        <button className={`chip${mode === 'webgl' ? ' active' : ''}`} onClick={() => setMode('webgl')}>
          WebGL model (offline)
        </button>
        <button className={`chip${mode === 'unreal' ? ' active' : ''}`} onClick={() => setMode('unreal')}>
          Unreal Engine stream
        </button>
      </div>
      {mode === 'webgl' ? (
        <EngineViewer focusPart={focusPart} />
      ) : (
        <PixelStreamView />
      )}
    </div>
  );
}
