// ============================================================
// Serial task queue
// ============================================================
// Chrome fires tab/window/idle events concurrently. Tasks that read-then-write the
// same state (create a page, accrue time, ...) are run one at a time through a queue.

export interface SerialQueue {
  run<T>(task: () => Promise<T>): Promise<T>;
}

export function createQueue(): SerialQueue {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    run<T>(task: () => Promise<T>): Promise<T> {
      const result = tail.then(task);
      // Keep the chain alive after a failure; the caller still sees the rejection.
      tail = result.catch((err) => console.error('[RSR] queued task failed:', err));
      return result;
    },
  };
}
