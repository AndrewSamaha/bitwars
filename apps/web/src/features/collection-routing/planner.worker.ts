import { CollectionPlanner, type PlanRequest } from "./planner";

const planner = new CollectionPlanner();
self.onmessage = (event: MessageEvent<{ id: number; request: PlanRequest }>) => {
  const { id, request } = event.data;
  try {
    self.postMessage({ id, result: planner.plan(request) });
  } catch {
    self.postMessage({ id, result: { kind: "blocked", reason: "Collection route planning failed. No unplanned collection order was sent." } });
  }
};
