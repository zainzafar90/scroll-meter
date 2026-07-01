// Per-key serialized write queue that RECOVERS from rejection, so one failed
// write never blocks later writes (spec §10.2). The prior MVP's
// `queue = queue.then(work)` poisoned the chain permanently on the first error.
export function makeQueue() {
  const chains = new Map<string, Promise<void>>();
  return function enqueue(key: string, work: () => Promise<void>): Promise<void> {
    const prev = chains.get(key) ?? Promise.resolve();
    const next = prev.then(work, work); // run `work` whether prev resolved OR rejected
    chains.set(
      key,
      next.catch(() => {}),
    ); // store a non-rejecting tail so the chain never poisons
    return next; // caller still sees THIS write's success/failure
  };
}
