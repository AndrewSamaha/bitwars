import type { GameEntity, IntentInput } from "./playerGateway.js";

export type PlayerProfile = "observer" | "mover" | "builder";

export type PolicyConfig = {
  profile: PlayerProfile;
  moveRadius: number;
  entityTypeId?: string;
  blueprintId?: string;
};

export type PolicyInput = {
  tick?: number | string;
  ownedEntities: GameEntity[];
  hasPendingBuild: boolean;
};

export type PolicyDecision = {
  profile: PlayerProfile;
  tick?: number | string;
  candidates: Array<{ id: string; entity_type_id?: string; pos?: { x: number; y: number } }>;
  selected_entity_id?: number;
  action?: IntentInput;
  skip_reason?: string;
};

/** Small stable PRNG: same seed and calls produce the same sequence on every run. */
export class SeededRandom {
  private state: number;

  constructor(seed: string) {
    let hash = 2166136261;
    for (let index = 0; index < seed.length; index++) {
      hash ^= seed.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    this.state = hash >>> 0 || 0x6d2b79f5;
  }

  getState(): number { return this.state >>> 0; }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  }
}

export class DeterministicPolicy {
  private readonly random: SeededRandom;

  constructor(readonly seed: string, readonly config: PolicyConfig) {
    if (config.profile === "builder" && !config.blueprintId?.trim()) {
      throw new Error("builder profile requires --blueprint-id");
    }
    if (!Number.isFinite(config.moveRadius) || config.moveRadius <= 0) {
      throw new Error("move radius must be a positive number");
    }
    this.random = new SeededRandom(seed);
  }

  getRandomState(): number { return this.random.getState(); }

  decide(input: PolicyInput): PolicyDecision {
    const candidates = input.ownedEntities
      .filter(item => Number.isSafeInteger(Number(item.id)))
      .filter(item => !this.config.entityTypeId || item.entity_type_id === this.config.entityTypeId)
      .sort((left, right) => Number(left.id) - Number(right.id))
      .map(item => ({ id: String(item.id), entity_type_id: item.entity_type_id, pos: item.pos }));
    const base: PolicyDecision = { profile: this.config.profile, tick: input.tick, candidates };

    if (this.config.profile === "observer") return { ...base, skip_reason: "observer profile" };
    if (candidates.length === 0) return { ...base, skip_reason: "no eligible owned entities" };
    if (this.config.profile === "builder" && input.hasPendingBuild) {
      return { ...base, skip_reason: "build lifecycle still pending" };
    }

    const selected = candidates[Math.floor(this.random.next() * candidates.length)]!;
    const entityId = Number(selected.id);
    if (this.config.profile === "builder") {
      return {
        ...base,
        selected_entity_id: entityId,
        action: { type: "Build", entity_id: entityId, blueprint_id: this.config.blueprintId! },
      };
    }

    const angle = this.random.next() * Math.PI * 2;
    const origin = selected.pos ?? { x: 0, y: 0 };
    return {
      ...base,
      selected_entity_id: entityId,
      action: {
        type: "Move",
        entity_id: entityId,
        target: {
          x: origin.x + Math.cos(angle) * this.config.moveRadius,
          y: origin.y + Math.sin(angle) * this.config.moveRadius,
        },
      },
    };
  }

  nextJitter(maxJitterMs: number): number {
    return Math.floor(this.random.next() * (maxJitterMs + 1));
  }
}
