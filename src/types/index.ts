export interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine: string;
  engineCode: string;
  displacement: string;
  fuel: string;
  transmission: string;
  drivetrain: string;
  etorque?: boolean;
  ess?: boolean;
}

export interface ProcedureStep {
  n: number;
  title: string;
  detail?: string;
  reference?: string;
  warning?: string;
  torqueId?: string;
  /** ids of 3D parts related to this step */
  parts3d?: string[];
}

export interface Procedure {
  id: string;
  title: string;
  system: string;
  engineCodes: string[];
  vehicleIds: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  timeHours: number;
  tools: string[];
  safety: string[];
  removal: ProcedureStep[];
  installation: ProcedureStep[];
  tips: string[];
  source?: string;
}

export interface Part {
  id: string;
  name: string;
  number: string;
  system: string;
  engineCodes: string[];
  price: number;
  stock: number;
  location: string;
  torqueId?: string;
}

export interface TorqueSpec {
  id: string;
  component: string;
  engine: string;
  steps: string[];
  nm: number;
  ftLb: number;
  notes?: string;
}

export interface DTC {
  code: string;
  title: string;
  system: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  causes: string[];
  fixes: string[];
  procedureIds: string[];
}

export type PageId =
  | 'dashboard'
  | 'vehicles'
  | 'procedures'
  | 'procedure'
  | 'parts'
  | 'torque'
  | 'viewer'
  | 'diagnostics'
  | 'wiring';

export interface Route {
  page: PageId;
  /** procedure id / vehicle id / part focus depending on page */
  id?: string;
  /** 3D part to highlight when opening the viewer */
  focusPart?: string;
}
