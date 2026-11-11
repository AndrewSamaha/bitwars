import { CollectionPlanner, MovePlanner, type MovePlanRequest, type PlanRequest } from "./planner";

const collectionPlanner = new CollectionPlanner();
const movePlanner = new MovePlanner();
self.onmessage = (event: MessageEvent<{ id: number; kind?: "move"; request: PlanRequest | MovePlanRequest }>) => {
  const { id, kind, request } = event.data;
  try {
    self.postMessage({ id, result: kind === "move" ? movePlanner.plan(request as MovePlanRequest) : collectionPlanner.plan(request as PlanRequest) });
  } catch {
    if (kind === "move") {
      self.postMessage({ id, result: { kind: "blocked", reason: "Move route planning failed. No unplanned Move order was sent." } });
      return;
    }
    const collection = request as PlanRequest;
    self.postMessage({ id, result: { kind: "blocked", reasonCode: "planner_failed",
      reason: "Collection route planning failed. No unplanned collection order was sent.",
      ...(collection.assignment.resourceTypeId ? { resourceTypeId: collection.assignment.resourceTypeId } : {}),
      ...(collection.pinned?.sourceEntityId ? { sourceEntityId: collection.pinned.sourceEntityId } : {}),
      ...(collection.currentPlan?.depotEntityId ? { depotEntityId: collection.currentPlan.depotEntityId } : {}) } });
  }
};
