import { useEffect, useState } from 'react';

/** Detects whether this browser/device can present an immersive-VR session. */
export function useVrStatus() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const nav = navigator as Navigator & {
      xr?: { isSessionSupported: (mode: string) => Promise<boolean> };
    };
    if (nav.xr?.isSessionSupported) {
      nav.xr
        .isSessionSupported('immersive-vr')
        .then((ok) => {
          if (!cancelled) setSupported(ok);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return supported;
}
