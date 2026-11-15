import { afterEach, expect, it, vi } from "vitest";
import { advanceSelfDestructConfirmation, createSelfDestructConfirmation } from "../src/features/hud/selfDestructConfirmation";

afterEach(() => vi.restoreAllMocks());

it("requires all four NATO initials in order, including repeated letters", () => {
  vi.spyOn(Math, "random").mockReturnValueOnce(4 / 26).mockReturnValueOnce(1 / 26)
    .mockReturnValueOnce(4 / 26).mockReturnValueOnce(21 / 26);
  let confirmation = createSelfDestructConfirmation("12", "me");
  expect(confirmation.words).toEqual(["echo", "bravo", "echo", "victor"]);
  for (const key of ["e", "b", "e"]) {
    const next = advanceSelfDestructConfirmation(confirmation, key);
    expect(next).not.toBe("confirmed");
    expect(next).not.toBeNull();
    confirmation = next as typeof confirmation;
  }
  expect(advanceSelfDestructConfirmation(confirmation, "v")).toBe("confirmed");
});

it("cancels on any wrong letter rather than allowing the sequence to continue", () => {
  const confirmation = { words: ["echo", "bravo", "echo", "victor"], index: 0, selectionKey: "12", playerId: "me" };
  expect(advanceSelfDestructConfirmation(confirmation, "b")).toBeNull();
  const afterFirst = advanceSelfDestructConfirmation(confirmation, "e");
  expect(afterFirst).not.toBeNull();
  expect(advanceSelfDestructConfirmation(afterFirst as typeof confirmation, "e")).toBeNull();
});
