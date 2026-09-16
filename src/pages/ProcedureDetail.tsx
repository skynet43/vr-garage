import { useMemo, useState } from 'react';
import { PART_META } from '../components/viewer/EngineViewer';
import { procedureById } from '../data/procedures';
import { torqueById } from '../data/torque';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { ProcedureStep, Route } from '../types';
import { Difficulty } from './Procedures';

interface Props {
  id: string;
  go: (r: Route) => void;
  back: () => void;
}

function StepRow({ step, done, toggle, go }: { step: ProcedureStep; done: boolean; toggle: () => void; go: (r: Route) => void }) {
  const torque = step.torqueId ? torqueById(step.torqueId) : undefined;
  return (
    <div className={`step${done ? ' done' : ''}`}>
      <button className="step-check" onClick={toggle} title={done ? 'Mark not done' : 'Mark done'}>✓</button>
      <div className="step-num">{String(step.n).padStart(2, '0')}</div>
      <div className="step-body">
        <div className="step-title">{step.title}</div>
        {step.detail && <div className="step-detail">{step.detail}</div>}
        {step.reference && <div className="step-ref">Refer to {step.reference}</div>}
        {step.warning && <div className="step-warn">⚠ {step.warning}</div>}
        {(torque || step.parts3d) && (
          <div className="step-links">
            {torque && (
              <button className="btn ghost small" onClick={() => go({ page: 'torque', id: torque.id })}>
                Torque: {torque.nm} N·m
              </button>
            )}
            {step.parts3d?.map((pid) =>
              PART_META[pid] ? (
                <button key={pid} className="btn ghost small" onClick={() => go({ page: 'viewer', focusPart: pid })}>
                  3D: {PART_META[pid].label}
                </button>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProcedureDetail({ id, go, back }: Props) {
  const proc = procedureById(id);
  const [tab, setTab] = useState<'removal' | 'install'>('removal');
  const [checked, setChecked] = useLocalStorage<Record<string, boolean>>(`vr-garage-proc-${id}`, {});

  const total = useMemo(
    () => (proc ? proc.removal.length + proc.installation.length : 0),
    [proc]
  );
  const doneCount = proc
    ? [...proc.removal.map((s) => `r${s.n}`), ...proc.installation.map((s) => `i${s.n}`)].filter((k) => checked[k]).length
    : 0;

  if (!proc) {
    return (
      <div>
        <button className="btn ghost small" onClick={back}>← Back</button>
        <div className="card" style={{ marginTop: 16 }}>Procedure not found.</div>
      </div>
    );
  }

  const toggle = (key: string) => setChecked({ ...checked, [key]: !checked[key] });
  const steps = tab === 'removal' ? proc.removal : proc.installation;
  const prefix = tab === 'removal' ? 'r' : 'i';

  return (
    <div>
      <button className="btn ghost small" onClick={back}>← All procedures</button>
      <div className="proc-head" style={{ marginTop: 14 }}>
        <div>
          <h1 className="page-title">{proc.title}</h1>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <span className="badge orange mono">{proc.id}</span>
            <span className="badge">{proc.system}</span>
            {proc.engineCodes.map((e) => (
              <span key={e} className="badge blue">{e}</span>
            ))}
            <span className="badge">{proc.timeHours} h</span>
            <span className="badge"><Difficulty level={proc.difficulty} /></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" onClick={() => go({ page: 'viewer' })}>Open in 3D viewer</button>
          <button className="btn ghost" onClick={() => setChecked({})}>Reset progress</button>
        </div>
      </div>

      <div className="muted" style={{ fontSize: 13 }}>
        {doneCount}/{total} steps complete ({total ? Math.round((doneCount / total) * 100) : 0}%)
      </div>
      <div className="progress-bar">
        <i style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} />
      </div>

      <div className="grid cols-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <h3>Safety first</h3>
          {proc.safety.map((s, i) => (
            <div key={i} className="callout red">{s}</div>
          ))}
        </div>
        <div className="card">
          <h3>Tools &amp; equipment</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }} className="muted">
            {proc.tools.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="tabs">
        <button className={`chip${tab === 'removal' ? ' active' : ''}`} onClick={() => setTab('removal')}>
          Removal ({proc.removal.length})
        </button>
        <button className={`chip${tab === 'install' ? ' active' : ''}`} onClick={() => setTab('install')}>
          Installation ({proc.installation.length})
        </button>
      </div>

      <div>
        {steps.map((s) => (
          <StepRow key={s.n} step={s} done={!!checked[`${prefix}${s.n}`]} toggle={() => toggle(`${prefix}${s.n}`)} go={go} />
        ))}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h3>Shop tips</h3>
        {proc.tips.map((t, i) => (
          <div key={i} className="callout green">{t}</div>
        ))}
        {proc.source && <div className="muted" style={{ fontSize: 12 }}>{proc.source}</div>}
      </div>
    </div>
  );
}
