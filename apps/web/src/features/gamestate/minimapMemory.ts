export type EntityObservation = {
  id: string | number;
  entity_type_id: string;
  owner_player_id: string;
  pos: { x: number; y: number };
  last_seen_tick: string | number;
};

export type RememberedEntity = Omit<EntityObservation, "last_seen_tick"> & {
  remembered: { last_seen_tick: string | number };
};

/** Server-owned observations, separate from selectable world entities and fog_memory policy. */
export class MinimapMemory {
  private sightings = new Map<string, RememberedEntity>();
  private playerId: string | null = null;
  private runId = "";

  setContext(playerId: string | null, runId: string) {
    if (playerId !== this.playerId || runId !== this.runId) this.clear();
    this.playerId = playerId;
    this.runId = runId;
  }

  replace(observations: readonly EntityObservation[]) {
    this.clear();
    for (const observation of observations) this.upsert(observation);
  }

  upsert(observation: EntityObservation) {
    const key = String(observation.id);
    if (!this.playerId || observation.owner_player_id === this.playerId) {
      this.sightings.delete(key);
      return;
    }
    this.sightings.set(key, {
      id: observation.id,
      entity_type_id: observation.entity_type_id,
      owner_player_id: observation.owner_player_id,
      pos: { ...observation.pos },
      remembered: { last_seen_tick: observation.last_seen_tick },
    });
  }

  get(id: string | number) { return this.sightings.get(String(id)); }
  forget(id: string | number) { this.sightings.delete(String(id)); }
  clear() { this.sightings.clear(); }
  entries() { return this.sightings.values(); }
}

export const minimapMemory = new MinimapMemory();