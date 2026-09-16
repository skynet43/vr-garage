import { useState } from 'react';
import { dtcByCode } from '../data/dtc';
import { BLE_PROFILES, bleSupported } from '../obd/bluetooth';
import { extractCodes, vinYear } from '../obd/elm327';
import { PIDS } from '../obd/types';
import { useObd } from '../obd/useObd';
import type { Route } from '../types';

interface Props {
  go: (r: Route) => void;
}

function JscanImport({ go }: { go: (r: Route) => void }) {
  const [text, setText] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);

  const run = (input: string) => {
    setCodes(extractCodes(input));
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    void f.text().then((t) => {
      setText(t.slice(0, 20000));
      run(t);
    });
  };

  return (
    <div className="card">
      <h3>JScan scan import</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
        In JScan: run Advanced Scan → share icon → export as file/email → paste the text here
        or drop the file. Codes link straight into Diagnostics.
      </p>
      <div className="filter-row">
        <input
          type="file"
          accept=".txt,.csv,.log,.xml,.html,.htm"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="…or paste the exported scan text here"
        rows={4}
        style={{
          width: '100%', background: 'var(--panel-2)', color: 'var(--text)',
          border: '1px solid var(--line)', borderRadius: 10, padding: 10,
          font: 'inherit', fontFamily: 'var(--mono)', fontSize: 12,
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="btn small" onClick={() => run(text)} disabled={!text.trim()}>
          Extract codes
        </button>
        {codes && <span className="muted" style={{ fontSize: 13 }}>{codes.length} code{codes.length === 1 ? '' : 's'} found</span>}
      </div>
      {codes && codes.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {codes.map((c) => {
            const known = dtcByCode(c);
            return (
              <button key={c} className="btn ghost small" onClick={() => go({ page: 'diagnostics', id: known ? c : undefined })}>
                <span className="mono">{c}</span>{known ? ` — ${known.title}` : ' (not in library)'}
              </button>
            );
          })}
        </div>
      )}
      {codes && codes.length === 0 && (
        <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>No P/C/B/U codes found in that text.</div>
      )}
    </div>
  );
}

export function ObdLive({ go }: Props) {
  const { state, connectDemo, connectBle, connectCustomUuids, disconnect, refreshDtcs, clearDtcs, startPolling, stopPolling } = useObd();
  const [profile, setProfile] = useState<string>('auto');
  const [svc, setSvc] = useState('');
  const [wr, setWr] = useState('');
  const [nt, setNt] = useState('');

  const connected = state.status === 'connected';
  const busy = state.status === 'connecting';

  const onClear = () => {
    if (!window.confirm('Clear all fault codes? This also wipes freeze-frame data and resets readiness monitors.')) return;
    void clearDtcs().then((ok) => {
      if (!ok) window.alert('Codes remain — see the error banner. Diagnose before clearing again.');
    });
  };

  return (
    <div>
      <h1 className="page-title">OBD live</h1>
      <p className="page-sub">
        Talk to the Jeep through your Bluetooth OBD adapter — the same ELM327 hardware JScan uses —
        or import a JScan scan below. No app store middleman.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Adapter</h3>
          <span className={`badge ${connected ? 'green' : busy ? 'yellow' : ''}`}>
            {state.status === 'idle' ? 'disconnected' : state.status}
          </span>
          {state.adapter && <span className="muted" style={{ fontSize: 13 }}>{state.adapter}</span>}
          {state.fw && <span className="badge blue mono">{state.fw.slice(0, 28)}</span>}
        </div>

        {!connected && !busy && (
          <>
            <div className="filter-row" style={{ marginTop: 12 }}>
              <select value={profile} onChange={(e) => setProfile(e.target.value)} title="Adapter profile">
                <option value="auto">Auto-detect adapter</option>
                {BLE_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <button className="btn small" onClick={() => void connectBle(profile)} disabled={!bleSupported()}>
                Connect Bluetooth
              </button>
              <button className="btn ghost small" onClick={() => void connectDemo()}>
                Try demo mode
              </button>
            </div>
            <div className="muted" style={{ fontSize: 12.5 }}>
              {BLE_PROFILES.find((p) => p.id === profile)?.note ?? 'Cycles every known BLE layout until the adapter answers.'}
            </div>
            {!bleSupported() && (
              <div className="step-warn" style={{ marginTop: 10 }}>
                Web Bluetooth isn't available in this browser. Use Chrome or Edge on Android/Windows/macOS
                over HTTPS — iOS Safari can't reach Bluetooth adapters (use the JScan import below instead).
              </div>
            )}
            <details style={{ marginTop: 10 }}>
              <summary className="muted" style={{ cursor: 'pointer', fontSize: 13 }}>Unlisted adapter? Enter UUIDs manually</summary>
              <div className="filter-row" style={{ marginTop: 8 }}>
                <input value={svc} onChange={(e) => setSvc(e.target.value)} placeholder="Service UUID (e.g. FFE0)" className="mono" style={{ minWidth: 200 }} />
                <input value={wr} onChange={(e) => setWr(e.target.value)} placeholder="Write char (e.g. FFE1)" className="mono" style={{ minWidth: 200 }} />
                <input value={nt} onChange={(e) => setNt(e.target.value)} placeholder="Notify char (e.g. FFE1)" className="mono" style={{ minWidth: 200 }} />
                <button
                  className="btn ghost small"
                  disabled={!bleSupported() || !svc.trim() || !wr.trim() || !nt.trim()}
                  onClick={() => void connectCustomUuids(svc.trim(), wr.trim(), nt.trim())}
                >
                  Connect custom
                </button>
              </div>
            </details>
          </>
        )}

        {(busy || state.progress) && <div className="muted" style={{ marginTop: 10 }}>{state.progress || 'Connecting…'}</div>}
        {state.error && <div className="step-warn" style={{ marginTop: 10 }}>⚠ {state.error}</div>}

        {connected && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn ghost small" onClick={() => (state.polling ? stopPolling() : startPolling())}>
              {state.polling ? 'Pause live data' : 'Resume live data'}
            </button>
            <button className="btn ghost small" onClick={() => void disconnect()}>Disconnect</button>
          </div>
        )}
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Live data</h3>
            {connected && (
              <span className="muted" style={{ fontSize: 12 }}>
                {state.polling ? 'updating…' : 'paused'}
              </span>
            )}
          </div>
          {!connected && <p className="muted" style={{ fontSize: 13 }}>Connect an adapter or start demo mode to stream PIDs.</p>}
          <div className="grid cols-2">
            {PIDS.map((p) => {
              const v = connected ? state.values[p.pid] : undefined;
              return (
                <div key={p.pid} className="gauge">
                  <div className="gauge-label">{p.label}</div>
                  <div className="gauge-num">
                    {v === undefined ? '—' : v.toFixed(p.digits ?? 0)}
                    <span className="gauge-unit"> {p.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Fault codes {state.dtcs.length > 0 && <span className="badge red">{state.dtcs.length}</span>}</h3>
              {connected && (
                <button className="btn ghost small" onClick={() => void refreshDtcs()}>Re-read</button>
              )}
            </div>
            {!connected && <p className="muted" style={{ fontSize: 13 }}>Stored codes appear here after connecting.</p>}
            {connected && state.dtcs.length === 0 && <p className="muted" style={{ fontSize: 13 }}>No stored codes — system pass. 🎉</p>}
            {state.dtcs.map((code) => {
              const known = dtcByCode(code);
              return (
                <div key={code} className="step" style={{ marginBottom: 8 }}>
                  <div className="step-body">
                    <div className="step-title mono">{code}</div>
                    <div className="step-detail">{known ? known.title : 'Not in the VR Garage library yet'}</div>
                    {known && (
                      <div className="step-links">
                        <button className="btn ghost small" onClick={() => go({ page: 'diagnostics', id: code })}>
                          Diagnose {code}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {connected && state.dtcs.length > 0 && (
              <button className="btn ghost small" onClick={onClear}>Clear codes…</button>
            )}
          </div>

          <div className="card">
            <h3>Vehicle</h3>
            {!connected || !state.vin ? (
              <p className="muted" style={{ fontSize: 13 }}>VIN is read automatically on connect (Mode 09).</p>
            ) : (
              <>
                <div className="mono" style={{ fontSize: 16, letterSpacing: 1 }}>{state.vin}</div>
                <div className="proc-meta">
                  <span className="badge blue">Model year {vinYear(state.vin)}</span>
                  <span className="badge">{state.vin.length === 17 ? 'valid 17-char VIN' : `${state.vin.length} chars`}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <JscanImport go={go} />
      </div>
    </div>
  );
}
