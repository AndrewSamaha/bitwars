export const NATO_WORDS = [
  "alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel",
  "india", "juliett", "kilo", "lima", "mike", "november", "oscar", "papa",
  "quebec", "romeo", "sierra", "tango", "uniform", "victor", "whiskey", "x-ray",
  "yankee", "zulu",
] as const;

export type SelfDestructConfirmation = { words: string[]; index: number; selectionKey: string; playerId: string };

export function createSelfDestructConfirmation(selectionKey: string, playerId: string): SelfDestructConfirmation {
  return {
    words: Array.from({ length: 4 }, () => NATO_WORDS[Math.floor(Math.random() * NATO_WORDS.length)]),
    index: 0, selectionKey, playerId,
  };
}

export function advanceSelfDestructConfirmation(confirmation: SelfDestructConfirmation, key: string): SelfDestructConfirmation | "confirmed" | null {
  if (key !== confirmation.words[confirmation.index]?.[0]) return null;
  return confirmation.index === confirmation.words.length - 1
    ? "confirmed"
    : { ...confirmation, index: confirmation.index + 1 };
}
