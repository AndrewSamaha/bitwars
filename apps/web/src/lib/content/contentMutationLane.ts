// Shared by route bundles, independent of live publication and Redis.
const lane = globalThis as typeof globalThis & { __contentMutationLane?: Promise<void> };

export function serializeContentMutation<T>(action: () => Promise<T>): Promise<T> {
  const result = (lane.__contentMutationLane ?? Promise.resolve()).then(action);
  const tail = result.then(() => undefined, () => undefined);
  lane.__contentMutationLane = tail;
  void tail.then(() => {
    if (lane.__contentMutationLane === tail) lane.__contentMutationLane = undefined;
  });
  return result;
}

/** Battle capture must be coherent with live editor file writes, but never queues behind them. */
export function tryContentCapture<T>(action: () => Promise<T>) {
  if (lane.__contentMutationLane) return null;
  return serializeContentMutation(action);
}
