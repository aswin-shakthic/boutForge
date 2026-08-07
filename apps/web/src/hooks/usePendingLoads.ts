"use client";

import { useCallback, useState } from "react";

/** Track in-flight async work; `isPending` is true while any tracked load is running. */
export function usePendingLoads(initialCount = 0) {
  const [pending, setPending] = useState(initialCount);

  const start = useCallback(() => {
    setPending((count) => count + 1);
  }, []);

  const end = useCallback(() => {
    setPending((count) => Math.max(0, count - 1));
  }, []);

  const track = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      start();
      try {
        return await fn();
      } finally {
        end();
      }
    },
    [start, end]
  );

  return { isPending: pending > 0, start, end, track };
}
