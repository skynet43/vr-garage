import type { TorqueSpec } from '../types';

export const torqueSpecs: TorqueSpec[] = [
  { id: 'tq-head-bolts', component: 'Cylinder head bolts (NEW, TTY)', engine: 'EC1 / EC3', steps: ['Step 1: 30 N·m in sequence', 'Step 2: +90° in sequence', 'Step 3: +90° in sequence'], nm: 30, ftLb: 22, notes: 'Torque-to-yield. Never reuse bolts. Chase and dry all bolt holes first.' },
  { id: 'tq-timing-cover', component: 'Timing cover bolts', engine: 'EC1 / EC3', steps: ['Tighten in sequence to 12 N·m'], nm: 12, ftLb: 9, notes: 'Apply approved RTV bead; respect open time.' },
  { id: 'tq-crank-pulley', component: 'Crankshaft pulley bolt (NEW)', engine: 'EC1 / EC3', steps: ['100 N·m', '+90°'], nm: 100, ftLb: 74, notes: 'One-time-use bolt. Hold crankshaft with holding tool.' },
  { id: 'tq-valve-cover', component: 'Cylinder head cover bolts', engine: 'EC1 / EC3', steps: ['Tighten in sequence to 10 N·m'], nm: 10, ftLb: 7, notes: 'Always fit a new gasket; do not overtighten plastic cover.' },
  { id: 'tq-intake', component: 'Intake manifold bolts', engine: 'EC1 / EC3', steps: ['Tighten in sequence to 12 N·m'], nm: 12, ftLb: 9 },
  { id: 'tq-turbo-nuts', component: 'Turbocharger mounting nuts', engine: 'EC1 / EC3', steps: ['Tighten in sequence to 28 N·m'], nm: 28, ftLb: 21, notes: 'Use new copper nuts where specified.' },
  { id: 'tq-cam-caps', component: 'Camshaft bearing cap bolts', engine: 'EC1 / EC3', steps: ['Tighten in sequence to 10 N·m'], nm: 10, ftLb: 7 },
  { id: 'tq-oil-drain', component: 'Engine oil drain plug', engine: 'EC1 / EC3', steps: ['Tighten to 30 N·m with new washer'], nm: 30, ftLb: 22 },
  { id: 'tq-oil-filter-cap', component: 'Oil filter cap', engine: 'EC1 / EC3', steps: ['Tighten to 25 N·m with new O-ring'], nm: 25, ftLb: 18, notes: 'Lubricate O-ring with clean oil.' },
  { id: 'tq-spark-plugs', component: 'Spark plugs', engine: 'EC1 / EC3', steps: ['Tighten to 18 N·m'], nm: 18, ftLb: 13, notes: 'No anti-seize on coated plug threads.' },
  { id: 'tq-caliper-bracket', component: 'Front caliper bracket bolts', engine: 'All', steps: ['Tighten to 130 N·m with threadlocker'], nm: 130, ftLb: 96 },
  { id: 'tq-caliper-pins', component: 'Front caliper guide pin bolts', engine: 'All', steps: ['Tighten to 35 N·m'], nm: 35, ftLb: 26 },
  { id: 'tq-lug-nuts', component: 'Wheel lug nuts', engine: 'All', steps: ['Tighten in star pattern to 175 N·m'], nm: 175, ftLb: 129, notes: 'Re-torque after 100 km.' },
  { id: 'tq-mgu', component: 'eTorque MGU mounting bolts', engine: 'EC3', steps: ['Tighten to 45 N·m'], nm: 45, ftLb: 33 },
  { id: 'tq-vac-bracket', component: 'Vacuum pump bracket bolts', engine: 'EC1 / EC3', steps: ['Tighten to 12 N·m'], nm: 12, ftLb: 9 },
  { id: 'tq-exhaust-man', component: 'Exhaust manifold nuts', engine: 'EC1 / EC3', steps: ['Tighten center-out to 25 N·m'], nm: 25, ftLb: 18 },
];

export const torqueById = (id: string) => torqueSpecs.find((t) => t.id === id);
