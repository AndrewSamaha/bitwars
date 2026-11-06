import { CollectionPlanner, MovePlanner, type MovePlanRequest, type PlanRequest } from "./planner";

const collectionPlanner = new CollectionPlanner();
const movePlanner = new MovePlanner();
self.onmessage = (event: MessageEvent<{ id: number; kind?: "move"; request: PlanRequest | MovePlanRequest }>) => {
  const { id, kind, request } = event.data;
  try {
    self.postMessage({ id, result: kind === "move" ? movePlanner.plan(request as MovePlanRequest) : collectionPlanner.plan(request as PlanRequest) });
  } catch {
    self.postMessage({ id, result: { kind: "blocked", reason: kind === "move"
      ? "Move route planning failed. No unplanned Move order was sent."
      : "Collection route planning failed. No unplanned collection order was sent." } });
  }
};
