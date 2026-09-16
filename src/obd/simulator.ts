import type { ByteTransport } from './types';

/**
 * Simulated ELM327 + ECU for demo mode (no hardware needed).
 * RPM/speed/temps drift realistically; reports demo DTCs P0300 + P0299.
 */
export class SimulatorTransport implements ByteTransport {
  label = 'Demo simulator (virtual 2.0L eTorque)';
  private listeners = new Set<(chunk: string) => void>();
  private t0 = Date.now();
  private closed = false;

  onData(cb: (chunk: string) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async close(): Promise<void> {
    this.closed = true;
    this.listeners.clear();
  }

  async writeLine(line: string): Promise<void> {
    if (this.closed) return;
    const cmd = line.trim().toUpperCase();
    // simulate adapter latency
    await new Promise((r) => setTimeout(r, 60 + Math.random() * 120));
    if (this.closed) return;
    const t = (Date.now() - this.t0) / 1000;
    const rpm = Math.round(780 + Math.sin(t / 3) * 60 + (t % 25 < 6 ? 900 + Math.sin(t * 2) * 250 : 0));
    const vss = t % 25 < 6 ? Math.round(35 + Math.sin(t) * 12) : 0;
    const ect = Math.round(88 + Math.sin(t / 40) * 3);
    const iat = Math.round(34 + Math.sin(t / 30) * 2);
    const load = Math.round(vss > 0 ? 42 + Math.sin(t) * 8 : 17 + Math.sin(t / 2) * 2);
    const tp = Math.round(vss > 0 ? 22 + Math.sin(t) * 5 : 12);
    const map = Math.round(vss > 0 ? 70 + Math.sin(t) * 12 : 32);
    const stft = Math.round(128 + Math.sin(t / 2) * 6);
    const ltft = Math.round(128 + Math.sin(t / 9) * 4);

    const hx = (n: number, pad = 2) => Math.max(0, Math.round(n)).toString(16).toUpperCase().padStart(pad, '0');
    const pair = (pid: string, ...bytes: number[]) => `41 ${pid} ${bytes.map((b) => hx(b)).join(' ')}\r`;

    let resp: string;
    if (cmd === 'ATZ') resp = 'ELM327 v2.1 (SIMULATOR)\r';
    else if (cmd.startsWith('AT')) resp = cmd === 'ATRV' ? '14.2V\r' : 'OK\r';
    else if (cmd === '0100' || cmd === '0120' || cmd === '0140') resp = `41 00 FF FF FF FF\r`;
    else if (cmd === '010C') resp = pair('0C', (rpm * 4) >> 8, (rpm * 4) & 0xff);
    else if (cmd === '010D') resp = pair('0D', vss);
    else if (cmd === '0105') resp = pair('05', ect + 40);
    else if (cmd === '010F') resp = pair('0F', iat + 40);
    else if (cmd === '0104') resp = pair('04', (load * 255) / 100);
    else if (cmd === '0111') resp = pair('11', (tp * 255) / 100);
    else if (cmd === '010B') resp = pair('0B', map);
    else if (cmd === '0106') resp = pair('06', stft);
    else if (cmd === '0107') resp = pair('07', ltft);
    else if (cmd === '0142') resp = pair('42', 0x39, 0x80); // 14720 mV
    else if (cmd === '012F') resp = pair('2F', 178);
    else if (cmd === '010E') resp = pair('0E', 150);
    else if (cmd === '03') resp = '43 02 03 00 02 99 00 00 00 00\r';
    else if (cmd === '07') resp = '47 00 00 00 00 00 00 00\r';
    else if (cmd === '04') resp = '44\r';
    else if (cmd === '0902') resp = vinFrames('1C4HJXEN8NW314159');
    else resp = 'NO DATA\r';

    queueMicrotask(() => {
      for (const cb of this.listeners) cb(resp + '>');
    });
  }
}

function vinFrames(vin: string): string {
  // 09 02 multi-frame: "49 02 01 ..." payload chunks
  const bytes = [...vin].map((c) => c.charCodeAt(0));
  let out = '';
  let seq = 1;
  for (let i = 0; i < bytes.length; i += 4) {
    const chunk = bytes.slice(i, i + 4);
    out +=
      `49 02 0${seq} ` +
      chunk.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ') +
      '\r';
    seq++;
  }
  return out;
}
