import { contentManager, ContentSyncError, type ContentManager } from "./contentManager";

/** Named SSE events and reconnect handshakes converge on the same exact fetch. */
export async function syncContentChangedEvent(data: string, manager: ContentManager = contentManager): Promise<boolean> {
  try {
    const payload = JSON.parse(data) as { content_revision?: unknown; reload_id?: unknown; activated_tick?: unknown };
    if (!payload || typeof payload !== "object" || typeof payload.content_revision !== "string" || !/^[a-f0-9]{64}$/.test(payload.content_revision)
      || typeof payload.reload_id !== "string" || typeof payload.activated_tick !== "number"
      || !Number.isSafeInteger(payload.activated_tick) || payload.activated_tick < 0) {
      throw new ContentSyncError({ stage: "notification", code: "invalid_content_event", message: "Invalid content_changed event" });
    }
    return await manager.validateAndSync(payload.content_revision, {
      reload_id: payload.reload_id, activated_tick: payload.activated_tick,
    });
  } catch (error) {
    manager.reportRendererFailure(error instanceof ContentSyncError ? error : new ContentSyncError({
      stage: "notification", code: "invalid_content_event", message: error instanceof Error ? error.message : String(error),
    }));
    return false;
  }
}
