import { dtcs } from './dtc';
import { procedureById } from './procedures';
import { wiringDocs } from './wiring.generated';

/**
 * Cross-links between repair content and wiring diagrams.
 * Step keys are `${procedureId}:r|i${stepNumber}` (r = removal, i = installation).
 */

/** procedure step -> wiring diagram ids */
export const stepWiringLinks: Record<string, string[]> = {
  // Cylinder head & head gasket (EC1/EC3)
  'PROC-HG-20T:r2': ['fuses-battery-ess', 'fuses-battery-etorque'],
  'PROC-HG-20T:r8': ['starting-charging-system-2-0l-etorque'],
  'PROC-HG-20T:r9': ['fuses-battery-ess'],
  'PROC-HG-20T:r11': ['hvac-system-atc'],
  'PROC-HG-20T:r14': ['fuses-relay-asd-2-0l'],
  'PROC-HG-20T:r15': ['fuses-relay-asd-2-0l'],
  'PROC-HG-20T:r21': ['fuses-relay-asd-2-0l'],
  'PROC-HG-20T:r22': ['fuses-relay-asd-2-0l'],
  'PROC-HG-20T:r27': ['fuses-relay-asd-2-0l'],
  'PROC-HG-20T:i12': ['data-link-connector'],
  // Timing cover (EC1/EC3)
  'PROC-TC-20T:r3': ['fuses-battery-ess', 'fuses-battery-etorque'],
  'PROC-TC-20T:r7': ['starting-charging-system-2-0l-etorque'],
  'PROC-TC-20T:r8': ['starting-charging-system-2-0l-etorque'],
  'PROC-TC-20T:i8': ['data-link-connector'],
  // Accessory belt (eTorque belt runs the MGU)
  'PROC-BELT-20T:r2': ['starting-charging-system-2-0l-etorque'],
  // Front brakes (ABS/WSS circuits live at the hub)
  'PROC-BRK-FRT:i4': ['brake-system'],
};

/** DTC -> wiring diagram ids */
export const dtcWiringLinks: Record<string, string[]> = {
  P0300: ['fuses-relay-asd-2-0l'],
  P0301: ['fuses-relay-asd-2-0l'],
  P0016: ['fuses-relay-asd-2-0l'],
  P0017: ['fuses-relay-asd-2-0l'],
  P0299: ['fuses-relay-asd-2-0l'],
  C121C: ['can-c-bus-system'],
  U0100: ['can-c-bus-system', 'data-link-connector'],
};

export const wiringTitle = (id: string) =>
  wiringDocs.find((d) => d.id === id)?.title ?? id;

export interface StepRef {
  procId: string;
  procTitle: string;
  section: 'Removal' | 'Installation';
  n: number;
  title: string;
}

/** All procedure steps that reference a diagram (for reverse links). */
export function stepsForDiagram(docId: string): StepRef[] {
  const refs: StepRef[] = [];
  for (const [key, ids] of Object.entries(stepWiringLinks)) {
    if (!ids.includes(docId)) continue;
    const [procId, sk] = key.split(':');
    const proc = procedureById(procId);
    if (!proc) continue;
    const isRemoval = sk.startsWith('r');
    const n = Number(sk.slice(1));
    const step = (isRemoval ? proc.removal : proc.installation).find((s) => s.n === n);
    if (!step) continue;
    refs.push({
      procId,
      procTitle: proc.title,
      section: isRemoval ? 'Removal' : 'Installation',
      n,
      title: step.title,
    });
  }
  return refs;
}

/** All DTCs that reference a diagram (for reverse links). */
export function dtcsForDiagram(docId: string) {
  return dtcs.filter((d) => dtcWiringLinks[d.code]?.includes(docId));
}
