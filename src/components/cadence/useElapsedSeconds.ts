import { useEffect, useState } from 'preact/hooks';

export function useElapsedSeconds(startedAt: number | null, running: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  return startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
}
