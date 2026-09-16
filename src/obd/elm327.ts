import type { ByteTransport } from './types';

/**
 * ELM327 client over any ByteTransport.
 * Serializes commands, strips echo, and resolves each command when the
 * '>' prompt arrives.
 */
export class Elm327 {
  private transport: ByteTransport;
  private buffer = '';
  private chain: Promise<void> = Promise.resolve();
  private pending: {
    cmd: string;
    resolve: (lines: string[]) => void;
    reject: (err: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;

  constructor(transport: ByteTransport) {
    this.transport = transport;
    transport.onData((chunk) => this.handle(chunk));
  }

  get label() {
    return this.transport.label;
  }

  private handle(chunk: string) {
    this.buffer += chunk;
    let idx: number;
    while ((idx = this.buffer.indexOf('>')) >= 0) {
      const raw = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 1);
      const p = this.pending;
      this.pending = null;
      if (!p) continue;
      clearTimeout(p.timer);
      const echo = p.cmd.replace(/\s+/g, '').toUpperCase();
      const lines = raw
        .split('\r')
        .map((s) => s.trim())
        .filter(Boolean)
        .filter(
          (l) =>
            l.replace(/\s+/g, '').toUpperCase() !== echo &&
            !l.startsWith('SEARCHING') &&
            !l.startsWith('BUS INIT') &&
            l !== '?'
        );
      p.resolve(lines);
    }
  }

  command(cmd: string, timeoutMs = 5000): Promise<string[]> {
    const run = () =>
      new Promise<string[]>((resolve, reject) => {
        const timer = setTimeout(() => {
          if (this.pending) {
            this.pending = null;
            reject(new Error(`No response to ${cmd} (timeout)`));
          }
        }, timeoutMs);
        this.pending = { cmd, resolve, reject, timer };
        this.transport.writeLine(cmd).catch((err: unknown) => {
          clearTimeout(timer);
          this.pending = null;
          reject(err instanceof Error ? err : new Error(String(err)));
        });
      });
    const result = this.chain.then(run, run);
    this.chain = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  /** Standard init sequence: reset, quiet, auto protocol. */
  async init(): Promise<string> {
    let version = '';
    const seq: [string, number][] = [
      ['ATZ', 8000],
      ['ATE0', 3000],
      ['ATH0', 3000],
      ['ATL0', 3000],
      ['ATS0', 3000],
      ['ATSP0', 5000],
    ];
    for (const [cmd, t] of seq) {
      const lines = await this.command(cmd, t);
      if (cmd === 'ATZ' && lines.length > 0) version = lines.join(' ');
    }
    return version;
  }

  async close() {
    await this.transport.close();
  }
}

/* ---------------- response parsers ---------------- */

function hexBytes(lines: string[]): number[] {
  const out: number[] = [];
  for (const tok of lines.join(' ').split(/\s+/)) {
    if (/^[0-9A-Fa-f]{2}$/.test(tok)) out.push(parseInt(tok, 16));
  }
  return out;
}

/** Mode 01 PID data bytes, or null when the ECU answers NO DATA etc. */
export function parsePid(lines: string[], pid: string): number[] | null {
  const bytes = hexBytes(lines);
  const want = parseInt(pid, 16);
  for (let i = 0; i + 1 < bytes.length; i++) {
    if (bytes[i] === 0x41 && bytes[i + 1] === want) {
      return bytes.slice(i + 2);
    }
  }
  return null;
}

/** Mode 03/07 confirmed/permanent DTCs: ['P0300', …] */
export function parseDtcs(lines: string[]): string[] {
  const bytes = hexBytes(lines);
  if (bytes.length < 3 || (bytes[0] !== 0x43 && bytes[0] !== 0x47 && bytes[0] !== 0x4a)) return [];
  const out: string[] = [];
  for (let i = 2; i + 1 < bytes.length; i += 2) {
    const a = bytes[i];
    const b = bytes[i + 1];
    if (a === 0 && b === 0) continue;
    const type = ['P', 'C', 'B', 'U'][(a & 0xc0) >> 6];
    const code =
      `${type}${((a & 0x30) >> 4).toString(16)}${(a & 0x0f).toString(16)}` +
      `${(b >> 4).toString(16)}${(b & 0x0f).toString(16)}`;
    out.push(code.toUpperCase());
  }
  return [...new Set(out)];
}

/** Mode 09 02 VIN (multi-frame ASCII). */
export function parseVin(lines: string[]): string {
  const bytes = hexBytes(lines);
  const chars: number[] = [];
  for (let i = 0; i + 2 < bytes.length; i++) {
    if (bytes[i] === 0x49 && bytes[i + 1] === 0x02) {
      for (const c of bytes.slice(i + 3)) {
        if (c === 0x49) break; // next frame header
        chars.push(c);
      }
    }
  }
  return String.fromCharCode(...chars.filter((c) => c >= 32 && c < 127)).replace(/[^A-HJ-NPR-Z0-9]/g, '');
}

/** 10th VIN char -> model year. */
export function vinYear(vin: string): string {
  const table: Record<string, string> = {
    L: '2020', M: '2021', N: '2022', P: '2023', R: '2024', S: '2025', T: '2026',
    K: '2019', J: '2018', H: '2017', G: '2016', F: '2015', E: '2014', D: '2013',
  };
  return vin.length >= 10 ? table[vin[9].toUpperCase()] ?? '20??' : '';
}

/** Pull P/C/B/U codes out of arbitrary pasted text (JScan share exports, notes…). */
export function extractCodes(text: string): string[] {
  const found = text.toUpperCase().match(/\b[PCBU][0-9A-F]{4}\b/g) ?? [];
  return [...new Set(found)];
}
