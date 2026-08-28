type Pos = { x: number; y: number };

export type StreamEntity = {
  id: number | string;
  entity_type_id?: string;
  owner_player_id?: string;
  health?: number;
  pos?: Pos;
  vel?: Pos;
  force?: Pos;
};

type EntityType = {
  sensor?: { range?: number };
  visibility_range?: number;
};

type SnapshotPayload = {
  type: "snapshot";
  tick: number | string;
  entities: StreamEntity[];
  player_ledgers?: Array<{ player_id: string; resources: unknown[] }>;
  collector_states?: Array<{ entity_id: number | string }>;
  combat_effect_states?: Array<{ entity_id: number | string }>;
};

type DeltaPayload = {
  type: "delta";
  tick: number | string;
  removed_entity_ids?: Array<number | string>;
  updates: StreamEntity[];
  collector_state_updates?: Array<{ entity_id: number | string }>;
  combat_effect_state_updates?: Array<{ entity_id: number | string }>;
};

const idOf = (id: number | string) => String(id);
const hasPosition = (entity: StreamEntity): entity is StreamEntity & { pos: Pos } =>
  Number.isFinite(entity.pos?.x) && Number.isFinite(entity.pos?.y);

/** Projects authoritative state into one player's visible world. */
export class VisibilityFilter {
  private entities = new Map<string, StreamEntity>();
  private visible = new Set<string>();

  constructor(
    readonly playerId: string,
    private readonly entityTypes: Record<string, EntityType>,
  ) {}

  filterSnapshot(snapshot: SnapshotPayload): SnapshotPayload {
    this.entities = new Map(snapshot.entities.map((entity) => [idOf(entity.id), { ...entity }]));
    this.visible = this.currentlyVisible();
    return {
      ...snapshot,
      entities: snapshot.entities.filter((entity) => this.visible.has(idOf(entity.id))),
      player_ledgers: snapshot.player_ledgers?.filter((ledger) => ledger.player_id === this.playerId),
      collector_states: snapshot.collector_states?.filter((state) => this.visible.has(idOf(state.entity_id))),
      combat_effect_states: snapshot.combat_effect_states?.filter((state) => this.visible.has(idOf(state.entity_id))),
    };
  }

  filterDelta(delta: DeltaPayload): DeltaPayload | undefined {
    const wasVisible = new Set(this.visible);
    const removed: Array<number | string> = [];
    for (const id of delta.removed_entity_ids ?? []) {
      const key = idOf(id);
      if (wasVisible.has(key)) removed.push(id);
      this.entities.delete(key);
    }
    for (const update of delta.updates) {
      const key = idOf(update.id);
      this.entities.set(key, { ...this.entities.get(key), ...update });
    }

    const nowVisible = this.currentlyVisible();
    const updates: StreamEntity[] = [];
    for (const [key, entity] of this.entities) {
      if (!wasVisible.has(key) && nowVisible.has(key)) {
        updates.push(entity);
      } else if (wasVisible.has(key) && !nowVisible.has(key)) {
        removed.push(entity.id);
      }
    }
    for (const update of delta.updates) {
      const key = idOf(update.id);
      if (wasVisible.has(key) && nowVisible.has(key)) updates.push(update);
    }
    this.visible = nowVisible;

    const collector_state_updates = delta.collector_state_updates?.filter((state) => nowVisible.has(idOf(state.entity_id)));
    const combat_effect_state_updates = delta.combat_effect_state_updates?.filter((state) => nowVisible.has(idOf(state.entity_id)));
    if (updates.length === 0 && removed.length === 0 && !collector_state_updates?.length && !combat_effect_state_updates?.length) return undefined;
    return { ...delta, removed_entity_ids: removed, updates, collector_state_updates, combat_effect_state_updates };
  }

  isPositionVisible(position: Pos): boolean {
    for (const source of this.sensorSources()) {
      const dx = source.pos.x - position.x;
      const dy = source.pos.y - position.y;
      if (dx * dx + dy * dy <= source.range * source.range) return true;
    }
    return false;
  }

  private currentlyVisible(): Set<string> {
    const visible = new Set<string>();
    const sources = this.sensorSources();
    for (const [key, entity] of this.entities) {
      if (entity.owner_player_id === this.playerId) {
        visible.add(key);
        continue;
      }
      if (!hasPosition(entity)) continue;
      const targetRange = this.entityTypes[entity.entity_type_id ?? ""]?.visibility_range ?? 0;
      if (sources.some((source) => {
        const range = Math.max(source.range, targetRange);
        const dx = source.pos.x - entity.pos.x;
        const dy = source.pos.y - entity.pos.y;
        return dx * dx + dy * dy <= range * range;
      })) visible.add(key);
    }
    return visible;
  }

  private sensorSources(): Array<{ pos: Pos; range: number }> {
    return [...this.entities.values()].flatMap((entity) => {
      const range = this.entityTypes[entity.entity_type_id ?? ""]?.sensor?.range ?? 0;
      return entity.owner_player_id === this.playerId && hasPosition(entity) && Number.isFinite(range) && range > 0
        ? [{ pos: entity.pos, range }]
        : [];
    });
  }
}
