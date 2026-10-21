type Observation = {
  id: string | number;
  pos?: { x: number; y: number };
  entity_type_id?: string;
  owner_player_id?: string;
};

type RememberedEntity = Observation & {
  pos: { x: number; y: number };
  remembered: { last_seen_at: number };
};

/** Last authoritative sightings, separate from selectable world entities. */
export class MinimapMemory {
  private sightings = new Map<string, RememberedEntity>();
  private owners = new Map<string, string>();
  private playerId: string | null = null;
  private runId = "";

  setContext(playerId: string | null, runId: string) {
    if (playerId !== this.playerId || runId !== this.runId) this.clear();
    this.playerId = playerId;
    this.runId = runId;
  }

  observe(entity: Observation) {
    if (!this.playerId) return;
    const key = String(entity.id);
    const previous = this.sightings.get(key);
    const owner = entity.owner_player_id ?? this.owners.get(key);
    if (owner !== undefined) this.owners.set(key, owner);
    if (owner === this.playerId) {
      this.sightings.delete(key);
      return;
    }
    const pos = entity.pos ?? previous?.pos;
    if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return;
    this.sightings.set(key, {
      id: entity.id,
      pos: { ...pos },
      entity_type_id: entity.entity_type_id ?? previous?.entity_type_id,
      owner_player_id: owner,
      remembered: { last_seen_at: Date.now() },
    });
  }

  forget(id: string | number) {
    this.sightings.delete(String(id));
    this.owners.delete(String(id));
  }
  clear() { this.sightings.clear(); this.owners.clear(); }
  entries() { return this.sightings.values(); }
}

export const minimapMemory = new MinimapMemory();
