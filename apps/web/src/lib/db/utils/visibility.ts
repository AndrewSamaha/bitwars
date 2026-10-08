type Pos = { x: number; y: number };

export type StreamEntity = {
  id: number | string;
  entity_type_id?: string;
  owner_player_id?: string;
  health?: number;
  damage_type?: string;
  pos?: Pos;
  vel?: Pos;
  force?: Pos;
  resources?: Array<{ resource_type: string; amount: number }>;
  resource_deposit?: { amount: number; remaining: number } | null;
};

type EntityType = {
  sensor?: { range?: number };
  visibility_range?: number;
};
type TechnologyDef = { effects?: Array<{ target: string; operation: "add" | "multiply" | "set" | "cap"; value: number }> };

type SnapshotPayload = {
  type: "snapshot";
  tick: number | string;
  entities: StreamEntity[];
  player_ledgers?: Array<{ player_id: string; resources: unknown[] }>;
  collector_states?: Array<{ entity_id: number | string }>;
  combat_effect_states?: Array<{ entity_id: number | string }>;
  player_technologies?: Array<{ player_id: string; technology_ids: string[] }>;
};

type DeltaPayload = {
  type: "delta";
  tick: number | string;
  removed_entity_ids?: Array<number | string>;
  /** Connection-local visibility loss, not an authoritative world removal. */
  hidden_entity_ids?: Array<number | string>;
  updates: StreamEntity[];
  collector_state_updates?: Array<{ entity_id: number | string }>;
  combat_effect_state_updates?: Array<{ entity_id: number | string }>;
};

const idOf = (id: number | string) => String(id);
const hasPosition = (entity: StreamEntity): entity is StreamEntity & { pos: Pos } =>
  Number.isFinite(entity.pos?.x) && Number.isFinite(entity.pos?.y);
const forClient = (entity: StreamEntity, playerId: string, withinSensors: boolean): StreamEntity => {
  const visible = entity.owner_player_id === playerId ? { ...entity } : (({ resources: _resources, ...rest }) => rest)(entity);
  if (entity.resource_deposit !== undefined && !withinSensors) visible.resource_deposit = null;
  return visible;
};

/** Projects authoritative state into one player's visible world. */
export class VisibilityFilter {
  private entities = new Map<string, StreamEntity>();
  private visible = new Set<string>();
  private withinSensors = new Set<string>();

  constructor(
    readonly playerId: string,
    private readonly entityTypes: Record<string, EntityType>,
    private readonly technologies: Record<string, TechnologyDef> = {},
  ) {}

  filterSnapshot(snapshot: SnapshotPayload): SnapshotPayload {
    this.entities = new Map(snapshot.entities.map((entity) => [idOf(entity.id), { ...entity }]));
    this.ownedTechnologies = new Set(snapshot.player_technologies?.find((state) => state.player_id === this.playerId)?.technology_ids ?? []);
    this.visible = this.currentlyVisible();
    this.withinSensors = this.currentlyWithinSensors();
    return {
      ...snapshot,
      entities: snapshot.entities.filter((entity) => this.visible.has(idOf(entity.id))).map((entity) => forClient(entity, this.playerId, this.withinSensors.has(idOf(entity.id)))),
      player_ledgers: snapshot.player_ledgers?.filter((ledger) => ledger.player_id === this.playerId),
      collector_states: snapshot.collector_states?.filter((state) => this.visible.has(idOf(state.entity_id))),
      combat_effect_states: snapshot.combat_effect_states?.filter((state) => this.visible.has(idOf(state.entity_id))),
      player_technologies: snapshot.player_technologies?.filter((state) => state.player_id === this.playerId),
    };
  }

  filterDelta(delta: DeltaPayload): DeltaPayload | undefined {
    const wasVisible = new Set(this.visible);
    const removed: Array<number | string> = [];
    const hidden: Array<number | string> = [];
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
    const nowWithinSensors = this.currentlyWithinSensors();
    const updates: StreamEntity[] = [];
    for (const [key, entity] of this.entities) {
      if (!wasVisible.has(key) && nowVisible.has(key)) {
        updates.push(forClient(entity, this.playerId, nowWithinSensors.has(key)));
      } else if (wasVisible.has(key) && !nowVisible.has(key)) {
        hidden.push(entity.id);
      } else if (nowVisible.has(key) && entity.resource_deposit && this.withinSensors.has(key) !== nowWithinSensors.has(key)) {
        updates.push({ id: entity.id, resource_deposit: nowWithinSensors.has(key) ? entity.resource_deposit : null });
      }
    }
    for (const update of delta.updates) {
      const key = idOf(update.id);
      if (!wasVisible.has(key) || !nowVisible.has(key)) continue;
      // Sparse deltas usually omit owner_player_id, so use the merged entity
      // state above when deciding whether this client may receive inventory.
      const entity = this.entities.get(key)!;
      const projected = forClient({ ...update, owner_player_id: entity.owner_player_id }, this.playerId, nowWithinSensors.has(key));
      if (update.owner_player_id === undefined) delete projected.owner_player_id;
      updates.push(projected);
    }
    this.visible = nowVisible;
    this.withinSensors = nowWithinSensors;

    const collector_state_updates = delta.collector_state_updates?.filter((state) => nowVisible.has(idOf(state.entity_id)));
    const combat_effect_state_updates = delta.combat_effect_state_updates?.filter((state) => nowVisible.has(idOf(state.entity_id)));
    if (updates.length === 0 && removed.length === 0 && hidden.length === 0 && !collector_state_updates?.length && !combat_effect_state_updates?.length) return undefined;
    return {
      ...delta,
      removed_entity_ids: removed,
      hidden_entity_ids: hidden,
      updates,
      collector_state_updates,
      combat_effect_state_updates,
    };
  }

  isPositionVisible(position: Pos): boolean {
    for (const source of this.sensorSources()) {
      const dx = source.pos.x - position.x;
      const dy = source.pos.y - position.y;
      if (dx * dx + dy * dy <= source.range * source.range) return true;
    }
    return false;
  }

  private currentlyWithinSensors(): Set<string> {
    return new Set([...this.entities].filter(([, entity]) => hasPosition(entity) && this.isPositionVisible(entity.pos)).map(([key]) => key));
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
      let range = this.entityTypes[entity.entity_type_id ?? ""]?.sensor?.range ?? 0;
      for (const id of this.ownedTechnologies) for (const effect of this.technologies[id]?.effects ?? []) {
        if (effect.target !== "entity.sensor.range") continue;
        if (effect.operation === "add") range += effect.value;
        if (effect.operation === "multiply") range *= effect.value;
        if (effect.operation === "set") range = effect.value;
        if (effect.operation === "cap") range = Math.min(range, effect.value);
      }
      return entity.owner_player_id === this.playerId && hasPosition(entity) && Number.isFinite(range) && range > 0
        ? [{ pos: entity.pos, range }]
        : [];
    });
  }

  private ownedTechnologies = new Set<string>();
}
