import type { ByteTransport } from './types';

export interface BleProfile {
  id: string;
  label: string;
  service: string;
  writeChar: string;
  notifyChar: string;
  note?: string;
}

/**
 * Known BLE UART layouts. OBD adapters are inconsistent, so `connectObd`
 * can auto-try every profile until one answers — plus fully custom UUIDs.
 */
export const BLE_PROFILES: BleProfile[] = [
  {
    id: 'ffe',
    label: 'Generic BLE (FFE0 / FFE1)',
    service: 'FFE0',
    writeChar: 'FFE1',
    notifyChar: 'FFE1',
    note: 'Veepeak, Vgate iCar 2/3 BLE and most clones',
  },
  {
    id: 'fff',
    label: 'Vgate iCar Pro BLE (FFF0)',
    service: 'FFF0',
    writeChar: 'FFF2',
    notifyChar: 'FFF1',
    note: 'Newer iCar Pro 2S / BLE 4.0 units',
  },
  {
    id: 'uart',
    label: 'Nordic UART',
    service: '6E400001-B5A3-F393-E0A9-E50E24DCCA9E',
    writeChar: '6E400002-B5A3-F393-E0A9-E50E24DCCA9E',
    notifyChar: '6E400003-B5A3-F393-E0A9-E50E24DCCA9E',
    note: 'DIY / nRF-based adapters',
  },
];

export const bleSupported = () =>
  typeof navigator !== 'undefined' && !!navigator.bluetooth;

class BleTransport implements ByteTransport {
  label: string;
  private device: BluetoothDevice;
  private write: BluetoothRemoteGATTCharacteristic;
  private notify: BluetoothRemoteGATTCharacteristic;
  private listeners = new Set<(chunk: string) => void>();
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();
  private onNotify = () => {
    const v = this.notify.value;
    if (v) this.emit(this.decoder.decode(v));
  };
  private onDrop = () => this.emit('');

  constructor(label: string, device: BluetoothDevice, write: BluetoothRemoteGATTCharacteristic, notify: BluetoothRemoteGATTCharacteristic) {
    this.label = label;
    this.device = device;
    this.write = write;
    this.notify = notify;
    notify.addEventListener('characteristicvaluechanged', this.onNotify);
    device.addEventListener('gattserverdisconnected', this.onDrop);
  }

  private emit(chunk: string) {
    for (const cb of this.listeners) cb(chunk);
  }

  onData(cb: (chunk: string) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async writeLine(line: string): Promise<void> {
    // BLE writes are MTU-limited; ELM commands are short but chunk anyway.
    const data = this.encoder.encode(`${line}\r`);
    for (let i = 0; i < data.length; i += 20) {
      await this.write.writeValue(data.slice(i, i + 20));
    }
  }

  async close(): Promise<void> {
    try {
      this.notify.removeEventListener('characteristicvaluechanged', this.onNotify);
      await this.notify.stopNotifications().catch(() => undefined);
    } finally {
      this.device.gatt?.disconnect();
      this.listeners.clear();
    }
  }
}

async function openProfile(
  server: BluetoothRemoteGATTServer,
  profile: BleProfile
): Promise<{ write: BluetoothRemoteGATTCharacteristic; notify: BluetoothRemoteGATTCharacteristic }> {
  const service = await server.getPrimaryService(profile.service);
  const notify = await service.getCharacteristic(profile.notifyChar);
  const write =
    profile.writeChar === profile.notifyChar
      ? notify
      : await service.getCharacteristic(profile.writeChar);
  await notify.startNotifications();
  return { write, notify };
}

/**
 * Pair + open an OBD BLE adapter. With profileId 'auto' (default) each known
 * layout is tried until one answers ATZ.
 */
export async function connectObd(
  profileId: string | 'auto' = 'auto',
  onProgress?: (msg: string) => void
): Promise<ByteTransport> {
  if (!bleSupported()) {
    throw new Error('Web Bluetooth is not available (needs Chrome/Edge over HTTPS — not iOS Safari).');
  }
  const say = onProgress ?? (() => undefined);
  const profiles =
    profileId === 'auto'
      ? BLE_PROFILES
      : BLE_PROFILES.filter((p) => p.id === profileId);
  if (profiles.length === 0) throw new Error(`Unknown adapter profile ${profileId}`);

  say('Choose your OBD adapter in the browser picker…');
  const device = await navigator.bluetooth!.requestDevice({
    filters: profiles.map((p) => ({ services: [p.service] })),
    optionalServices: profiles.map((p) => p.service),
  });
  const server = await device.gatt!.connect();
  const errors: string[] = [];
  for (const profile of profiles) {
    try {
      say(`Trying ${profile.label}…`);
      const { write, notify } = await openProfile(server, profile);
      const transport = new BleTransport(
        `${device.name ?? 'OBD adapter'} (${profile.label})`,
        device,
        write,
        notify
      );
      // probe: must answer ATZ
      const ok = await probe(transport);
      if (ok) return transport;
      await transport.close().catch(() => undefined);
      errors.push(`${profile.label}: no answer`);
    } catch (err) {
      errors.push(`${profile.label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  server.disconnect();
  throw new Error(`Adapter paired but no profile answered. ${errors.join(' · ')}`);
}

/** Connect with fully manual UUIDs (for unlisted adapters). */
export async function connectCustom(
  service: string,
  writeChar: string,
  notifyChar: string,
  onProgress?: (msg: string) => void
): Promise<ByteTransport> {
  if (!bleSupported()) throw new Error('Web Bluetooth is not available in this browser.');
  const say = onProgress ?? (() => undefined);
  say('Choose your OBD adapter in the browser picker…');
  const device = await navigator.bluetooth!.requestDevice({
    filters: [{ services: [service] }],
    optionalServices: [service],
  });
  const server = await device.gatt!.connect();
  const { write, notify } = await openProfile(server, {
    id: 'custom',
    label: 'custom',
    service,
    writeChar,
    notifyChar,
  });
  const transport = new BleTransport(`${device.name ?? 'OBD adapter'} (custom UUIDs)`, device, write, notify);
  if (!(await probe(transport))) {
    await transport.close().catch(() => undefined);
    throw new Error('Adapter opened but did not answer ATZ — check the UUIDs.');
  }
  return transport;
}

function probe(transport: ByteTransport): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      unsub();
      resolve(ok);
    };
    const timer = setTimeout(() => done(false), 3500);
    const unsub = transport.onData((chunk) => {
      if (chunk.includes('>') || /ELM|OK/i.test(chunk)) {
        clearTimeout(timer);
        done(true);
      }
    });
    transport.writeLine('ATZ').catch(() => {
      clearTimeout(timer);
      done(false);
    });
  });
}
