import { describe, expect, it, vi } from "vitest";
import { GameConnection } from "../src/features/gamestate/connection";

describe("game connection freshness", () => {
  it("requires a snapshot, reconciliation and engine health before playing", () => {
    const connection = new GameConnection();
    connection.begin();
    connection.health(true);
    connection.receivedSnapshot();
    expect(connection.getSnapshot()).toBe("connecting");
    connection.reconciledIntents();
    expect(connection.getSnapshot()).toBe("live");
    connection.disconnect();
    expect(connection.getSnapshot()).toBe("reconnecting");
    connection.health(true);
    expect(connection.getSnapshot()).toBe("reconnecting");
    connection.receivedSnapshot();
    expect(connection.getSnapshot()).toBe("reconnecting");
    connection.reconciledIntents();
    expect(connection.getSnapshot()).toBe("live");
  });

  it("freezes when the stream silently stalls, including after browser sleep", () => {
    const now = vi.spyOn(performance, "now");
    now.mockReturnValue(0);
    const connection = new GameConnection();
    connection.receivedSnapshot();
    connection.reconciledIntents();
    connection.health(true);
    expect(connection.check(2499)).toBe(true);
    expect(connection.check(2500)).toBe(false);
    expect(connection.getSnapshot()).toBe("reconnecting");
    expect(connection.check(60000)).toBe(false);
    now.mockRestore();
  });

  it("does not consider an open transport sufficient when the engine stops", () => {
    const connection = new GameConnection();
    connection.receivedSnapshot();
    connection.reconciledIntents();
    connection.health(true);
    connection.health(false);
    expect(connection.check()).toBe(false);
    expect(connection.getSnapshot()).toBe("reconnecting");
  });
});
