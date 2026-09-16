import { Config, Flags, PixelStreaming, TextParameters } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.8';
import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

type StreamStatus = 'idle' | 'connecting' | 'live' | 'error';

/**
 * Unreal Engine 5.8 Pixel Streaming player.
 *
 * The UE app + signalling server run on the shop PC (see UNREAL.md);
 * this component shows the WebRTC stream and forwards mouse/keyboard input.
 * UI-interaction descriptors ({cmd:'vrg:…'}) travel over the data channel
 * for the phase-2 UE command handler.
 */
export function PixelStreamView() {
  const mountRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<PixelStreaming | null>(null);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useLocalStorage('vr-garage-ue-signal', 'ws://127.0.0.1:8888');
  const [explode, setExplode] = useState(0.25);
  const [ack, setAck] = useState('');

  useEffect(() => {
    return () => {
      try {
        streamRef.current?.disconnect();
      } catch {
        /* already gone */
      }
      streamRef.current = null;
    };
  }, []);

  const send = (descriptor: object) => {
    const s = streamRef.current;
    if (!s || status !== 'live') return false;
    try {
      return s.emitUIInteraction(descriptor);
    } catch {
      return false;
    }
  };

  const connect = () => {
    const mount = mountRef.current;
    if (!mount) return;
    disconnect();
    setStatus('connecting');
    setMessage(`Contacting signalling server at ${url}…`);
    setAck('');

    try {
      const config = new Config();
      config.setTextSetting(TextParameters.SignallingServerUrl, url);
      config.setFlagEnabled(Flags.AutoConnect, false);
      config.setFlagEnabled(Flags.AutoPlayVideo, true);

      const stream = new PixelStreaming(config, { videoElementParent: mount });
      streamRef.current = stream;

      stream.addEventListener('playStream', () => {
        try {
          stream.play();
        } catch {
          /* user gesture may be required; the click-to-play overlay handles it */
        }
      });
      stream.addEventListener('videoInitialized', () => {
        setStatus('live');
        setMessage('');
      });
      stream.addEventListener('streamDisconnect', () => {
        setStatus('idle');
        setMessage('Stream ended.');
      });
      stream.addEventListener('webRtcFailed', () => {
        setStatus('error');
        setMessage('WebRTC failed — is the UE app running and paired with the signalling server?');
      });
      stream.addEventListener('playStreamError', (e) => {
        setStatus('error');
        const detail = (e as unknown as { message?: string })?.message ?? '';
        setMessage(`Player error. ${detail}`.trim());
      });
      stream.addEventListener('playStreamRejected', (e) => {
        const reason = (e as unknown as { reason?: string })?.reason ?? '';
        setStatus('error');
        setMessage(
          reason === 'NeededCtrlClick'
            ? 'The browser wants a click to start video — click the player.'
            : `Stream rejected. ${reason}`.trim()
        );
      });
      stream.addResponseEventListener('vrg:ack', (response: string) => {
        setAck(response);
      });

      stream.connect();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const disconnect = () => {
    try {
      streamRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    streamRef.current = null;
    if (mountRef.current) mountRef.current.innerHTML = '';
    setStatus((s) => (s === 'live' || s === 'connecting' ? 'idle' : s));
  };

  const onExplode = (v: number) => {
    setExplode(v);
    send({ cmd: 'vrg:explode', value: Math.round(v * 100) / 100 });
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Unreal Engine stream</h3>
          <span className={`badge ${status === 'live' ? 'green' : status === 'error' ? 'red' : status === 'connecting' ? 'yellow' : ''}`}>
            {status === 'idle' ? 'offline' : status === 'live' ? 'live' : status}
          </span>
          {ack && <span className="badge blue mono">{ack.slice(0, 60)}</span>}
        </div>
        <div className="filter-row" style={{ marginTop: 12, marginBottom: 0 }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="ws://127.0.0.1:8888"
            className="mono"
            style={{ minWidth: 240 }}
            disabled={status === 'live' || status === 'connecting'}
          />
          {status === 'live' || status === 'connecting' ? (
            <button className="btn ghost small" onClick={disconnect}>Disconnect</button>
          ) : (
            <button className="btn small" onClick={connect}>Connect to UE</button>
          )}
        </div>
        {message && <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>{message}</div>}
        {status === 'idle' && !message && (
          <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            Runs against the shop PC: start the signalling server + VRGarage UE app there
            (see <span className="mono">UNREAL.md</span>), then connect. Mouse/keyboard input
            forwards to the engine automatically.
          </div>
        )}
      </div>

      <div className="viewer-canvas-wrap" style={{ minHeight: 480 }}>
        <div ref={mountRef} style={{ width: '100%', height: 560 }} />
        {status !== 'live' && (
          <div className="viewer-hint">No stream — WebGL tab stays available offline</div>
        )}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3>Assembly commands <span className="muted" style={{ fontWeight: 400 }}>(sent over the data channel)</span></h3>
        <div className="slider-row">
          <span className="muted">Explode</span>
          <input
            type="range" min={0} max={1.4} step={0.01} value={explode}
            onChange={(e) => onExplode(Number(e.target.value))}
            disabled={status !== 'live'}
          />
          <span className="mono">{Math.round((explode / 1.4) * 100)}%</span>
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
          Protocol: <span className="mono">{'{cmd:"vrg:explode",value} · {cmd:"vrg:focus",part} · {cmd:"vrg:spin",on}'}</span> —
          handled by the UE command actor (UNREAL.md, phase 2).
        </div>
      </div>
    </div>
  );
}
