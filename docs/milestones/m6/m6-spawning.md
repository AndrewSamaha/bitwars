# M6: Spawn on Join + Random Loadout — Approach

## Goals

1. **Entities spawn only when a player enters the game** — no pre-spawning for fixed slots at match start.
2. **Use the real player id** — when a player enters, the backend has their player id (e.g. UUID from auth); that id is assigned as `owner_player_id` on their entities.
3. **One loadout per player, chosen at random** — the spawn configuration contains a **list** of loadouts; when a player joins, one loadout is picked at random from that list and assigned to them. So a given player only ever gets one loadout.

---

## Current State (relevant)

- **Spawn config:** YAML with `spawn_points` (one per slot) and `loadouts` (one per slot), 1:1. At `init_world`, we spawn for every entry in `player_ids` using that slot’s spawn point and loadout. Engine config uses placeholder IDs (`"player-1"`, `"player-2"`).
- **Init:** All player entities are created at world start. No notion of “player enters” triggering spawn.
- **Identity mismatch:** Client has real player UUID from auth; engine entities use config player IDs. So the client never “owns” any entity unless we assign the real UUID at spawn time.

---

## Proposed Approach

### 1. Spawn config shape

- **`game_origin`**  
  Defaults to 0,0 but it represents the 'center' of the world relative to where players might spawn.

- **`max_distance_from_origin`**  
  Defaults to 10,000 -- Represents the maximum distance a player might spawn in from the game_origin. On connect, the server chooses a value for player_starting_origin, which represents a location at random in the world that is max_distance_from_origin. Once that point is identified, their entities are spawned within a random location no more than 100 from that player_starting_origin.

- **`loadouts`**  
  A **list** of loadout options (each loadout is a map `entity_type_id -> count`). Example: `[ loadoutA, loadoutB ]`. When a player joins, we **pick one at random** from this list and spawn that loadout for them. So each player gets exactly one loadout, and it’s random from the pool.

- **`neutrals_near_spawn`**  
  Unchanged: when we spawn a player at a given spawn point, we can also spawn these server-owned entities near that point.

So the config no longer has a 1:1 “slot index → loadout”; it defines the places in world where player_starting_origin might fall, and “pool of loadouts,” and we **assign** one of each to a player when they join.

---

### 2. Init world (match start)

- **With spawn config:**  
  Do **not** spawn any player entities at init. The world either starts with zero entities or only global neutrals (if we have any). So `init_world` with spawn config no longer loops over `player_ids` and spawns for each; it leaves player entities to be created on demand when “player joined” is processed.

- **Without spawn config:**  
  Keep current legacy behaviour (e.g. `spawn_manifest` + round-robin) for backward compatibility or demos if desired; otherwise treat as “no spawn config” and start empty.

So: **player entities only appear when we run “spawn for this player” on join.**

---

### 3. Tracking who has joined

- **In-engine state:**  
  Maintain a set (or map) of player ids that have already been given a spawn: e.g. `joined_players: HashSet<String>`, or `Map<player_id, spawn_point_index>` if we need to know which spawn each player got. When we run “spawn for player X,” we add X to this set (and optionally record which spawn point index they got).

- **Idempotency:**  
  “Spawn for player X” should mean “ensure this player has a loadout.” If X is already in `joined_players`, do nothing. That way reconnect or duplicate “join” events don’t create duplicate entities.

- **Restore from snapshot:**  
  If we restore from a snapshot (e.g. after engine restart), we can reconstruct “who has joined” from the current world: collect distinct `owner_player_id` from entities (excluding `"neutral"`). So we don’t strictly need to persist `joined_players` separately if we can derive it from the snapshot.

---

### 4. When “player enters the game” triggers spawn

- **Backend has the player when they enter:**  
  When the client “enters the game” (e.g. first request to the game state stream, or a dedicated “enter game” / “join match” endpoint), the backend has the auth cookie and can resolve **player_id** (the same UUID used elsewhere).

- **Backend tells the engine “this player joined”:**  
  We need a path from “backend knows player_id” to “engine runs spawn for that player_id.” Options:
  - **Option A — Redis queue:**  
    Backend pushes to a Redis list or set, e.g. `RPUSH rts:match:{game_id}:pending_joins {player_id}` (or `SADD` to avoid duplicates). The engine, each tick or on a timer, reads from this list, processes each id (spawn, then remove from list).
  - **Option B — HTTP to engine:**  
    Backend calls an engine endpoint (e.g. `POST /spawn_player` with `{ "player_id": "uuid" }`). Engine runs the spawn logic and returns.
  - **Option C — Same process:**  
    If the backend and engine run in the same process, the stream handler could call directly into the engine’s “spawn for player” function after auth.

  Recommendation: **Option A** if the engine is a separate process and already talks to Redis; minimal new surface. **Option B** if we prefer an explicit API. **Option C** only if everything is in-process.

So: **“Player enters the game” = first time the backend sees that authenticated player for this match; backend then enqueues or sends that player_id to the engine.**

---

### 5. Engine: “spawn for player” flow

When the engine handles “player X joined” (from Redis, HTTP, or in-process):

1. **Already joined?**  
   If X is in `joined_players` (or we can infer they already have entities with `owner_player_id == X`), return (no-op).

2. **Choose spawn point:**  
   Pick an available spawn point: e.g. first index not yet assigned, or random among unassigned. Record that this spawn point is now used (and optionally store `player_id -> spawn_point_index`).

3. **Choose loadout:**  
   `loadout = loadouts[random(0..loadouts.len())]`. Use a deterministic RNG (e.g. seeded from game_id/tick) if we need reproducible replays; otherwise `thread_rng()` is fine.

4. **Spawn:**  
   Call the existing `on_player_spawn(entities, next_id, player_id, spawn_x, spawn_y, loadout, neutrals_near_spawn, rng)` with:
   - `player_id` = **X** (the real UUID),
   - `spawn_x`, `spawn_y` = position of the chosen spawn point (synonymous with player_starting_origin),
   - `loadout` = the randomly chosen loadout,
   - `neutrals_near_spawn` = from config.

5. **Update world and bookkeeping:**  
   Append the new entities to `state.entities`, advance `next_id` (or whatever global id counter we use). Add X to `joined_players`. If using Redis pending list, remove X from `rts:match:{game_id}:pending_joins`.

6. **Publish state:**  
   Write a new snapshot (or a delta that adds these entities) to Redis so all clients, including the joining one, see the new entities. Stream clients will get the update on the next snapshot/delta.

So: **one function “ensure_spawned(player_id)” that does: already joined → return; else pick spawn + random loadout, run on_player_spawn, update state, publish.**

---

### 6. Backend: when to enqueue “player joined”

- **On first stream connect:**  
  In the handler for `GET /api/v2/gamestate/stream`, after auth and resolving `player_id`, do **once per match** for this player: e.g. `SADD rts:match:{game_id}:joined {player_id}` then `RPUSH rts:match:{game_id}:pending_joins {player_id}` (or a single “ensure joined” script that only pushes if not already in a “processed joins” set). So the first time this player connects to the stream for this game, they get added to the join queue.

- **Idempotency:**  
  Engine ignores duplicates (already in `joined_players`). Backend can also avoid duplicate pushes by checking a “already requested spawn for this player” set in Redis if we want to avoid duplicate join messages.

So: **“Player enters the game” = first successful authenticated connection to the game state stream for that game; backend then enqueues that player_id for spawn.**

---

### 7. Config and engine config

- **Engine config:**  
  We can drop or repurpose `player_ids` in `GameConfig` for this flow: we no longer pre-spawn by slot. Spawn config path and spawn config parsing stay; only the **use** of the config changes (pool of loadouts, not “slot i → loadout i”).

- **Spawn config file:**  
  - `spawn_points`: list of `[x, y]` (or `{ x, y }`).  
  - `loadouts`: list of loadout objects (each a map of type_id -> count).  
  - `neutrals_near_spawn`: unchanged.

So: **same file format idea, but loadouts are a list of alternatives, and spawn_points are a list of positions to assign.**

---

## Implementation order (suggested)

1. **Config:** Change spawn config parsing, spawn configuration (game origin and max_distance_from_origin) and “list of loadouts” (no slot indexing).
2. **Init:** In `init_world`, when using spawn config, do not spawn any player entities (only neutrals if desired).
3. **Engine state:** Add `joined_players` (and optional spawn index map); ensure it can be restored from snapshot if needed.
4. **Engine:** Implement “spawn for player” (ensure_spawned): check joined, pick spawn point, pick random loadout, call `on_player_spawn`, update state, publish.
5. **Engine:** Add a way to receive “player joined” (Redis list read each tick, or HTTP endpoint, or in-process call).
6. **Backend:** On first stream connect for an authenticated player, push that player_id into the join queue (Redis or HTTP to engine).
7. **Tests:** One player joins → one loadout, correct owner; second player joins → second loadout, different spawn; reconnect → no second spawn.

---

## Summary

- **Spawn config:** Spawn points and loadouts are **lists**; no fixed “slot 0/1” ownership at init.
- **Init:** No player entities at match start; only neutrals if any.
- **Join event:** Backend, when it first sees an authenticated player for this game (e.g. on stream connect), sends that **player_id** to the engine (Redis queue or HTTP).
- **Engine:** For each new player_id: if already joined, skip; else assign one spawn point, pick one loadout at random, call `on_player_spawn` with that **player_id**, append entities, mark joined, publish.
- **Result:** Each player gets exactly one loadout (random from the list) and one spawn point when they enter the game, and their entities use their real player id so the client correctly shows “your” units.
