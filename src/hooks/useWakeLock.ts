/**
 * Keeps the screen awake during an active game. Feature detected, and a
 * no-op wherever the API is unavailable or refused.
 */

import { useEffect } from 'react';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener?: (type: 'release', listener: () => void) => void;
}

interface WakeLockLike {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
}

function getWakeLock(): WakeLockLike | null {
  if (typeof navigator === 'undefined') return null;
  const candidate = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock;
  return candidate && typeof candidate.request === 'function' ? candidate : null;
}

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const wakeLock = getWakeLock();
    if (!wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = () => {
      if (cancelled) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      wakeLock
        .request('screen')
        .then((result) => {
          if (cancelled) {
            void result.release();
            return;
          }
          sentinel = result;
        })
        .catch(() => {
          /* Refused by the browser or the user. Nothing to do. */
        });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && sentinel === null) acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (sentinel) void sentinel.release().catch(() => undefined);
      sentinel = null;
    };
  }, [active]);
}
