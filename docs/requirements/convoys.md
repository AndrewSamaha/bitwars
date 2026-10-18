# Convoy orders

Select 2–256 owned mobile ships, choose **Convoy** or press **V**, then click a
destination. Convoy replaces the members' current actions and clears their local
waypoint queues. Modifier keys do not queue convoy orders.

The server validates every member before claiming any action slot. Numeric entity
IDs determine a stable assignment to a centered grid aligned with the world axes.
Grid spacing is twice the largest hull radius plus one world unit. The initial
anchor is the centroid of the members' authoritative positions.

Members assemble at `anchor + offset`, each using its own content speed. Early
arrivals hold their exact slots. Once every member is ready, travel starts on the
following tick. The anchor advances at the minimum surviving member speed;
positions are derived from the anchor and fixed offsets. Convoy movement bypasses
ordinary velocity damping so spacing and shared speed remain exact. Ordinary
Move keeps its existing behavior.

The clicked destination is the final anchor position. Arrival finishes every
member action and dissolves the order. A successful individual replacement
command detaches only its target ship. Destruction also removes a member. Existing
offsets and anchor remain stable; the minimum speed is recalculated. A convoy with
one remaining member continues to its destination; an empty convoy dissolves.

## Protocol and storage

Protocol version 14 adds `IntentEnvelope.convoy`, containing `entity_ids` and
`destination`. The JSON command endpoint accepts:

```json
{
  "type": "Convoy",
  "entity_ids": [1, 2],
  "target": { "x": 500, "y": 600 },
  "client_cmd_id": "<UUIDv7>",
  "client_seq": 1,
  "policy": "REPLACE_ACTIVE",
  "run_id": "<current run ID>"
}
```

The envelope has one command ID and intent ID. Members occupy ordinary active
action slots, marked `convoy` in Redis reconnect tracking. Lifecycle events carry
`entity_id` to scope acceptance, cancellation, and completion to a member. An
unscoped rejection applies to the entire command. Member tracking is installed in
one Redis transaction.

Snapshots checkpoint convoy IDs, owner, anchor, destination, fixed slots, and
assembly/travel phase alongside entity positions. Engine recovery resumes saved
orders from that checkpoint and filters out members whose latest active tracking
shows a later replacement or completion. Orders created after the latest
checkpoint are not recovered; this feature does not change the engine's existing
checkpoint window. Browser disconnects do not stop an active convoy.

Snapshot JSON exposes convoy summaries only to the owning player's stream. The
game-query snapshot remains the administrative inspection surface. Group waypoint
queues, persistent fleet membership, obstacle avoidance, and rotating formations
are outside this initial implementation.
