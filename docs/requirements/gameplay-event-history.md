# Player gameplay-event history

Status: proposed scope and design options; not an implementation decision.
Updated: 2026-11-04.

## Goal and scope

Keep a server-side, player-scoped history of (1) every kind of event that currently
produces a minimap notification ping, (2) every kind of event that currently
produces a toast, and (3) **we are under attack**, which currently plays audio
but has no toast. A player should be able to inspect relevant events that occurred
while disconnected. Do not infer that all history entries must themselves become
toasts or pings on reconnect; presentation and catch-up behavior are separate
choices. Keep the existing `entity_destroyed` history.

The scope below inventories notification *kinds*, not every tick or every
repeated rendering of the same condition. A durable entry should identify its
player, run, occurrence time/tick, kind, and relevant entity/position or command
where applicable; preserve the information needed to render the notification
without persisting presentation wording as the sole source of truth. Never expose
unseen enemy activity or other players' private inventories. Define stable
occurrence/deduplication and retention rules before delivery to the UI.

## Notification inventory

| Requested history kind | Current presentation trigger | Origin and offline consideration |
| --- | --- | --- |
| Entity detected | Non-owned, newly known entity inside this player's sensor coverage on a client delta; minimap/sonar ping | Player-scoped visibility transition; a snapshot does not itself ping, and rediscovery of an already known entity does not currently ping. Engine discovery continues offline. |
| Construction completed | Finished local `build` or `upgrade` command, if its builder entity is present in the client world; minimap/sonar ping at the builder | Server lifecycle exists, but the browser currently consults its local intent queue to classify the command. Preserve builder-focus semantics unless deliberately changed. |
| Collection spacing violation | Rejected/canceled collect lifecycle with minimum-distance detail; `Collection blocked` toast | Server lifecycle reason and blocker/distances. |
| Collection waiting for turn | Owned solar collector changes to `waiting_for_turn`; `Collection blocked` toast | Transition in collector state, not every tick of waiting. |
| Collection drop-off blocked | Owned collector changes to `waiting_for_dropoff`; `Collection blocked` toast | Transition in collector state, not every tick of waiting. |
| Collection request has no capacity | Explicit local Collect selection targets a resource the worker cannot carry; `Collection blocked` toast | Browser-side command check; may not correspond to an accepted server intent. |
| Collection cargo full | Explicit Collect selection finds a full resource and a depot leg; `Delivering cargo` toast | Browser-side command check, rather than a generic server-side full-inventory event. |
| Resource transport canceled | Lifecycle canceled with `TRANSFER_ENDPOINT_LOST`; `Resource transport canceled` toast | Server lifecycle reason; existing presentation keeps any cargo aboard. |
| Resource starvation | Owned entity health drops with `resource_starvation` damage type; `Resource starvation` toast | Server damage cause; client currently shows only the first warning per entity for a mounted toast component. |
| Escort selection feedback | Invalid local escort target; `Escort` toast | Client-side input feedback; no command is submitted. |
| Saved waypoints cleared | Browser intent-queue storage migration notice; `Saved waypoints cleared` toast | Local storage migration, not a match-world event; may not occur while offline. |
| **We are under attack** | Owned entity health decreases with damage type other than resource starvation or radiation (including an untyped health decrease); `under-attack` audio, **no toast** | The server should identify hostile damage explicitly rather than relying on an untyped client fallback. The client currently plays once per entity per mounted stream bridge, rearming on a world change or bridge remount; define a meaningful repeat/incident policy before persisting. History inclusion does not imply adding a toast. |
| Entity destroyed (already recorded) | Engine combat (`laser`, `dismantle`) or radiation death | Already in `gameplay_events` for victim/attacker owners (combat) or victim owner (radiation); retain and avoid duplicating it when adding attack events. |

The minimap ping list is the two listeners for `ENTITY_DETECTED_EVENT` and
`BUILD_COMPLETED_EVENT` in `apps/web/src/features/pixijs/components/GameStage.tsx`.
The toast list is the `showToast` callsites in
`apps/web/src/features/hud/components/LifecycleToasts.tsx`. The attack audio
listener is in `apps/web/src/features/audio/components/AudioEventBridge.tsx`;
the health-change classification is in
`apps/web/src/features/gamestate/components/GameStateStreamBridge.tsx`.
The current browser message log is in-memory, capped at 100 entries; it is not
this durable history.

## Approaches considered

| Pattern | Benefits | Costs and limits |
| --- | --- | --- |
| Upload browser notification/ping callbacks to an authenticated endpoint | Exact match for what an online client presented; small initial change at callsites | Cannot capture game events while no browser is connected. Multiple tabs/retries can duplicate records; client-origin events are not authoritative. Presentation text and local component state become the record. |
| Project player events in the web/SSE layer from lifecycle events and visibility-filtered deltas | Reuses existing player-specific transport and much of its presentation logic | The existing visibility filter and notification transitions are connection-local and reset from a snapshot. A request-bound projector cannot observe absent players; a durable per-player worker/checkpoint, replay, ordering, and gap policy would be needed. |
| Publish semantic player-scoped events in the game engine | Authoritative and works while offline; can use server ticks, visibility, lifecycle and damage causes | More engine/stream work, especially per-player discovery, transition dedupe and ordering. It cannot know a browser-only invalid selection or local storage migration. |
| Hybrid: server facts for gameplay, separate explicitly identified client notices for browser-only feedback | Offline-complete for authoritative gameplay without inventing server versions of local interactions; single history UI can label origins | Requires an authenticated ingestion path and dedupe for local notices, a typed event union, and a clear distinction between game history and device-local notices. Client-only notices still cannot occur while the client is absent. |

Recommended direction for further design: **hybrid**, with engine-authored semantic
facts for gameplay and an explicit policy for client-only notices. Do not
write the same gameplay occurrence once from the engine and again from a toast
or ping callback. Decide whether browser-only notices belong in shared player
history or stay local before building a client upload path.

## Existing storage and delivery constraints

- `services/rts-engine/src/io/redis.rs` writes a match-scoped Redis Stream with
  approximate `MAXLEN ~ 100000`; scenario reset and clean start remove it.
  The writer currently emits only `entity_destroyed` for combat or radiation.
- `GET /api/v2/gameplay-events?after=<stream-id>` filters the stream's recipient
  list for the authenticated player. It reads up to 100 **raw match records** per
  page; `next_cursor` advances past scanned records even if none belong to that
  player. The current TypeScript record shape assumes a victim and cause, so
  other event kinds need an explicit typed schema and compatible readers/MCP.
- The live SSE stream (`rts:match:<game-id>:events`) is separate, trimmed more
  aggressively, and is not a substitute for offline notification history.
- Cursor behavior across resets, trimmed history gaps, multi-tab reads, and
  replay-to-UI rules need explicit treatment. Store run identity or an
  equivalent epoch so an old cursor cannot silently masquerade as a current
  run's history. A missed record should not become a newly revealed enemy.

## Acceptance criteria for a future implementation

1. Each listed gameplay kind produces at most one durable event per specified
   occurrence for an eligible player, whether online or disconnected; no
   unrelated player's hidden state leaks through history.
2. The existing destruction event remains readable and is not double-counted.
3. Repeated status ticks and repeated damage do not flood history; document
   when an ongoing warning may rearm, especially under attack and starvation.
4. A player can page from a saved cursor and distinguish a new run, an expired
   cursor, and an empty interval. UI catch-up does not pretend historic events
   are occurring live.
5. Browser-only feedback is either labeled and ingested with authenticated
   deduplication or intentionally kept local, with that choice documented.

## Open questions

- Does "all toasts" include browser-only input/migration notices in the
  server-backed player history, or should those remain device-local?
- For under attack, what closes an incident and permits a later one to be
  recorded: a quiet interval, a combat-state transition, or another rule?
  Should attack history include attacker identity only when visible?
- Should starvation warnings also rearm after recovery, unlike the current
  per-mounted-component once-per-entity guard?
- What retention horizon is required for an offline player, and how should
  history signal a trimmed gap? What UI should show for earlier records versus
  live pings/toasts/audio?
