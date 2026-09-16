/** Raw byte transport to an ELM327 adapter (BLE, simulator, …). */
export interface ByteTransport {
  label: string;
  /** Send one command line (without trailing CR). */
  writeLine(line: string): Promise<void>;
  /** Subscribe to decoded text chunks from the adapter. Returns unsubscribe. */
  onData(cb: (chunk: string) => void): () => void;
  close(): Promise<void>;
}

export interface PidDef {
  pid: string; // e.g. '0C'
  label: string;
  unit: string;
  bytes: number;
  digits?: number;
  fmt: (d: number[]) => number;
}

/** SAE J1979 PIDs we poll for live data. */
export const PIDS: PidDef[] = [
  { pid: '0C', label: 'Engine RPM', unit: 'rpm', bytes: 2, fmt: (d) => (d[0] * 256 + d[1]) / 4 },
  { pid: '0D', label: 'Vehicle speed', unit: 'km/h', bytes: 1, fmt: (d) => d[0] },
  { pid: '05', label: 'Coolant temp', unit: '°C', bytes: 1, fmt: (d) => d[0] - 40 },
  { pid: '0F', label: 'Intake air temp', unit: '°C', bytes: 1, fmt: (d) => d[0] - 40 },
  { pid: '04', label: 'Engine load', unit: '%', bytes: 1, fmt: (d) => (d[0] * 100) / 255, digits: 1 },
  { pid: '11', label: 'Throttle', unit: '%', bytes: 1, fmt: (d) => (d[0] * 100) / 255, digits: 1 },
  { pid: '0B', label: 'Manifold pressure', unit: 'kPa', bytes: 1, fmt: (d) => d[0] },
  { pid: '06', label: 'Short fuel trim 1', unit: '%', bytes: 1, fmt: (d) => ((d[0] - 128) * 100) / 128, digits: 1 },
  { pid: '07', label: 'Long fuel trim 1', unit: '%', bytes: 1, fmt: (d) => ((d[0] - 128) * 100) / 128, digits: 1 },
  { pid: '42', label: 'Control module voltage', unit: 'V', bytes: 2, fmt: (d) => (d[0] * 256 + d[1]) / 1000, digits: 1 },
  { pid: '2F', label: 'Fuel level', unit: '%', bytes: 1, fmt: (d) => (d[0] * 100) / 255, digits: 0 },
  { pid: '0E', label: 'Timing advance', unit: '°', bytes: 1, fmt: (d) => d[0] / 2 - 64, digits: 1 },
];

export type ObdStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface ObdSnapshot {
  values: Record<string, number | undefined>;
  dtcs: string[];
  vin: string;
  updatedAt: number;
}
