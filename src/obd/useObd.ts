import { useCallback, useEffect, useRef, useState } from 'react';
import { connectCustom, connectObd } from './bluetooth';
import { Elm327, parseDtcs, parsePid, parseVin } from './elm327';
import { SimulatorTransport } from './simulator';
import { PIDS, type ObdStatus } from './types';

export interface ObdState {
  status: ObdStatus;
  adapter: string;
  progress: string;
  error: string;
  fw: string;
  values: Record<string, number | undefined>;
  dtcs: string[];
  vin: string;
  updatedAt: number;
  polling: boolean;
}

const INITIAL: ObdState = {
  status: 'idle',
  adapter: '',
  progress: '',
  error: '',
  fw: '',
  values: {},
  dtcs: [],
  vin: '',
  updatedAt: 0,
  polling: false,
};

export function useObd() {
  const [state, setState] = useState<ObdState>(INITIAL);
  const elmRef = useRef<Elm327 | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false);

  const patch = useCallback((p: Partial<ObdState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    patch({ polling: false });
  }, [patch]);

  const disconnect = useCallback(async () => {
    stopPolling();
    try {
      await elmRef.current?.close();
    } finally {
      elmRef.current = null;
      setState({ ...INITIAL });
    }
  }, [stopPolling]);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    elmRef.current?.close().catch(() => undefined);
  }, []);

  const pollOnce = useCallback(async () => {
    const elm = elmRef.current;
    if (!elm || busyRef.current) return;
    busyRef.current = true;
    try {
      const values: Record<string, number | undefined> = {};
      for (const def of PIDS) {
        try {
          const lines = await elm.command(`01${def.pid}`, 2500);
          const data = parsePid(lines, def.pid);
          values[def.pid] = data && data.length >= def.bytes ? def.fmt(data) : undefined;
        } catch {
          values[def.pid] = undefined;
        }
      }
      patch({ values, updatedAt: Date.now() });
    } finally {
      busyRef.current = false;
    }
  }, [patch]);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    patch({ polling: true });
    void pollOnce();
    pollRef.current = setInterval(() => void pollOnce(), 1200);
  }, [patch, pollOnce]);

  const finishConnect = useCallback(
    async (elm: Elm327) => {
      elmRef.current = elm;
      patch({ progress: 'Initializing ELM327…' });
      const fw = await elm.init();
      patch({ fw });
      // snapshot: VIN + stored codes
      try {
        patch({ progress: 'Reading VIN…' });
        const vin = parseVin(await elm.command('0902', 6000));
        patch({ vin });
      } catch { /* older ECUs may refuse 0902 */ }
      try {
        const dtcs = parseDtcs(await elm.command('03', 6000));
        patch({ dtcs });
      } catch { /* ignore */ }
      patch({ status: 'connected', progress: '' });
      startPolling();
    },
    [patch, startPolling]
  );

  const connectDemo = useCallback(async () => {
    await disconnect();
    patch({ status: 'connecting', progress: 'Starting simulator…' });
    try {
      const elm = new Elm327(new SimulatorTransport());
      patch({ adapter: elm.label });
      await finishConnect(elm);
    } catch (err) {
      patch({ status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  }, [disconnect, finishConnect, patch]);

  const connectBle = useCallback(
    async (profileId: string | 'auto' = 'auto') => {
      await disconnect();
      patch({ status: 'connecting', progress: 'Opening Bluetooth…' });
      try {
        const transport = await connectObd(profileId, (progress) => patch({ progress }));
        const elm = new Elm327(transport);
        patch({ adapter: elm.label });
        await finishConnect(elm);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        patch({
          status: 'error',
          progress: '',
          error: /cancelled|canceled|not found/i.test(msg) ? 'Pairing cancelled — no adapter selected.' : msg,
        });
      }
    },
    [disconnect, finishConnect, patch]
  );

  const connectCustomUuids = useCallback(
    async (service: string, writeChar: string, notifyChar: string) => {
      await disconnect();
      patch({ status: 'connecting', progress: 'Opening Bluetooth…' });
      try {
        const transport = await connectCustom(service, writeChar, notifyChar, (progress) =>
          patch({ progress })
        );
        const elm = new Elm327(transport);
        patch({ adapter: elm.label });
        await finishConnect(elm);
      } catch (err) {
        patch({ status: 'error', error: err instanceof Error ? err.message : String(err), progress: '' });
      }
    },
    [disconnect, finishConnect, patch]
  );

  const refreshDtcs = useCallback(async () => {
    const elm = elmRef.current;
    if (!elm) return;
    patch({ progress: 'Reading fault codes…' });
    try {
      const dtcs = parseDtcs(await elm.command('03', 6000));
      patch({ dtcs, progress: '' });
    } catch (err) {
      patch({ progress: '', error: err instanceof Error ? err.message : String(err) });
    }
  }, [patch]);

  const clearDtcs = useCallback(async (): Promise<boolean> => {
    const elm = elmRef.current;
    if (!elm) return false;
    patch({ progress: 'Clearing codes…' });
    try {
      await elm.command('04', 8000);
      const dtcs = parseDtcs(await elm.command('03', 6000));
      patch({ dtcs, progress: '' });
      return dtcs.length === 0;
    } catch (err) {
      patch({ progress: '', error: err instanceof Error ? err.message : String(err) });
      return false;
    }
  }, [patch]);

  return {
    state,
    connectDemo,
    connectBle,
    connectCustomUuids,
    disconnect,
    refreshDtcs,
    clearDtcs,
    startPolling,
    stopPolling,
  };
}
