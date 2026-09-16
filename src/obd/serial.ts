import type { ByteTransport } from './types';

export const serialSupported = () =>
  typeof navigator !== 'undefined' && !!navigator.serial;

/** Common ELM327 baud rates. Clones are usually 38400 (v1.5) or 115200 (v2.1). */
export const BAUD_RATES = [9600, 38400, 115200, 230400, 500000];

class SerialTransport implements ByteTransport {
  label: string;
  private port: SerialPort;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private decoder = new TextDecoder();
  private listeners = new Set<(chunk: string) => void>();
  private running = true;

  constructor(port: SerialPort, baud: number) {
    this.port = port;
    const info = port.getInfo();
    const kind = info.bluetoothServiceClassId ? 'Bluetooth' : info.usbVendorId ? 'USB' : 'Serial';
    this.label = `${kind} ELM327 @ ${baud} baud`;
    void this.readLoop();
  }

  private emit(chunk: string) {
    for (const cb of this.listeners) cb(chunk);
  }

  onData(cb: (chunk: string) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private async readLoop() {
    try {
      if (!this.port.readable) return;
      this.reader = this.port.readable.getReader();
      while (this.running) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value && value.length > 0) {
          this.emit(this.decoder.decode(value, { stream: true }));
        }
      }
    } catch {
      /* port closed */
    } finally {
      try {
        this.reader?.releaseLock();
      } catch { /* already released */ }
      this.reader = null;
    }
  }

  async writeLine(line: string): Promise<void> {
    if (!this.port.writable) throw new Error('Serial port is not writable.');
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(new TextEncoder().encode(`${line}\r`));
    } finally {
      writer.releaseLock();
    }
  }

  async close(): Promise<void> {
    this.running = false;
    try {
      await this.reader?.cancel().catch(() => undefined);
    } finally {
      this.listeners.clear();
      await this.port.close().catch(() => undefined);
    }
  }
}

/**
 * Open a USB ELM327 cable or a classic-Bluetooth adapter that Windows has
 * already paired (pairing creates a COM port — pick the *outgoing* one).
 */
export async function connectSerialPort(baud: number): Promise<ByteTransport> {
  if (!serialSupported()) {
    throw new Error('Web Serial is not available (needs Chrome/Edge over HTTPS).');
  }
  let port: SerialPort;
  try {
    port = await navigator.serial!.requestPort();
  } catch {
    throw new Error('No port selected.');
  }
  try {
    await port.open({ baudRate: baud, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none' });
  } catch (err) {
    throw new Error(
      `Could not open the port: ${err instanceof Error ? err.message : String(err)} ` +
        `(is another app — JScan, Torque — holding it?)`
    );
  }
  return new SerialTransport(port, baud);
}
