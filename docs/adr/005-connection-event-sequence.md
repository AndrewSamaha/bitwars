The intended model is:

  authoritative snapshot S at stream boundary B
                   +
  all Redis Stream events after B
                   =
  current authoritative world

  0-0 is only a valid boundary for the very first snapshot of a brand-new match, when there have
  been no events yet. It should not be used as a normal reconnect cursor.

  For a new player, the correct ordering is:

  1. Authenticate player.
  2. Read the latest global snapshot and its boundary_stream_id B.
  3. Emit that snapshot to the client.
  4. Catch up all events after B; retain the final stream ID C as the cursor.
  5. Start (or be ready to start) XREAD from C.
  6. Enqueue the player’s join.
  7. Engine spawns the player and writes a normal delta event.
  8. The client receives that spawn delta through the same stream.

  Because Redis Streams are durable, step 5 doesn’t need a Pub/Sub-style atomic “subscribe before
  publish.” If the spawn happens after catch-up but just before XREAD executes, it is still read
  from cursor C. The crucial rule is: do not enqueue the join until the bootstrap cursor has been
  established.

# Implementation
  1. Wait for the engine’s latest snapshot—no replay from 0-0.
  2. Emit snapshot and catch up events after its boundary.
  3. Retain that durable event cursor, even if no catch-up events exist.
  4. Only then enqueue the player’s join.
  5. Read the spawned entities as normal deltas after that cursor.

  I also preserved the separate Redis connection for 15-second SSE XREADs, so the normal 2-second
  API timeout no longer interrupts live streaming.

