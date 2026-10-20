# Resupply

Mobile physical cargo carriers can load construction supplies from a friendly
depot before traveling outside service coverage. Select workers, choose **[H]
Resupply**, and click a friendly depot. Every resource fills to that worker's
carrying capacity: 50 energy, 50 minerals, and 50 food for a standard worker.
There are no resource amount controls or saved quantity preferences. Each selected
worker receives its own order using its own capacities, including mixed selections.

Workers move into hull contact with the selected depot, following it if it moves.
Loading transfers physical depot stock into the worker's existing inventory.
The engine's targets are the carrier's capacities, not additional cargo: existing cargo counts
toward the target and excess or unselected cargo is never unloaded. Resource
stock is conserved, loading cannot exceed capacity, and loading is instantaneous
at contact, like delivery. An empty depot is still a valid resupply destination;
a partial load waits there for the missing stock instead of completing early.
The worker detail panel shows `waiting for resupply` and a missing resource.

The command finishes once every target is met. A destroyed, removed, hostile, or
incompatible depot cancels it; cargo already loaded stays with the worker.
Carriers cannot resupply from themselves or arbitrary non-depot inventories.
Requested amounts must be finite, nonnegative, within the carrier's per-resource
capacity, and supported by the depot; at least one target must be positive.

## Follow-up orders

Shift-click the resupply depot to append Resupply to current work. Shift-click a
Move destination to queue it after Resupply. In the Build menu, enable **Queue
build after current orders** to follow the move with construction. Ctrl-click a
Move destination or resupply depot replaces the queued follow-up orders while
preserving current work. Orders appear in the Orders & waypoints panel.

The browser submits each follow-up only after the preceding order finishes.
Replacing a command or canceling/rejecting it clears its follow-up plan. These
local follow-up orders survive browser reload and resume on reconnect, but do
not advance while the browser is disconnected. Active Resupply is authoritative
and survives engine restart through active-intent tracking; the already loaded
cargo survives in entity snapshots. Reconnect includes the depot and target
amounts, without issuing a duplicate loading command.

Outside depot coverage, a physical carrier can already fund construction from
its cargo. A standard worker's 50 energy and 50 minerals fund two waypoints
(25 energy and 20 minerals each). Construction continues to use one funding
source per payment and does not combine cargo with depot stock.

## Interface and protocol

`POST /api/v1/intent` accepts:

```json
{
  "type": "Resupply",
  "entity_id": 1,
  "depot_id": 2,
  "target_amounts": { "energy": 50, "minerals": 50, "food": 50 },
  "client_cmd_id": "<UUIDv7>",
  "client_seq": 1,
  "policy": "REPLACE_ACTIVE"
}
```

The existing run-ID and authenticated-player checks apply. The player MCP
`send_intent` interface accepts the same Resupply payload. API and MCP callers
should wait for command completion before issuing subsequent Move/Build orders;
generic server-side APPEND queues are not introduced.

Resupply has its own protobuf intent and action variant. Engine and browser
protocol majors are 20; deploy/restart them together and refresh existing clients.
