export type CameraView = { x: number; y: number; zoom: number };

const key = (runId: string, playerId: string) => `bitwars:camera:${JSON.stringify([runId, playerId])}`;

export function readCameraView(runId: string, playerId: string, minZoom: number, maxZoom: number): CameraView | null {
  try {
    const view = JSON.parse(sessionStorage.getItem(key(runId, playerId)) ?? "null");
    if (!view || !Number.isFinite(view.x) || !Number.isFinite(view.y)
      || !Number.isFinite(view.zoom) || view.zoom <= 0) return null;
    return { x: view.x, y: view.y, zoom: Math.max(minZoom, Math.min(maxZoom, view.zoom)) };
  } catch {
    return null;
  }
}

export function saveCameraView(runId: string, playerId: string, view: CameraView): void {
  try {
    sessionStorage.setItem(key(runId, playerId), JSON.stringify(view));
  } catch {
    // Camera navigation still works when browser storage is unavailable.
  }
}
