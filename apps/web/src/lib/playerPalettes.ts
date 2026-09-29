/** Curated player colors, shared by the sprite preview and game renderer. */
export const PLAYER_PALETTES = [
  { id: "ember", name: "Ember", primary: "#ef5b45", secondary: "#ffd166" },
  { id: "tide", name: "Tide", primary: "#36b5e5", secondary: "#f4c95d" },
  { id: "orchid", name: "Orchid", primary: "#b876ed", secondary: "#65e0c1" },
  { id: "citrus", name: "Citrus", primary: "#e4bd32", secondary: "#5c8af0" },
  { id: "mint", name: "Mint", primary: "#57d29b", secondary: "#f47e80" },
  { id: "coral", name: "Coral", primary: "#f38376", secondary: "#78c5ef" },
  { id: "cobalt", name: "Cobalt", primary: "#5b83e8", secondary: "#f2aa61" },
  { id: "rose", name: "Rose", primary: "#e778a9", secondary: "#8ed77a" },
] as const;

export type PlayerPalette = (typeof PLAYER_PALETTES)[number];

/** Stable assignment so all clients render an owner the same way. */
export function paletteForOwner(ownerId: string): PlayerPalette {
  let hash = 2166136261;
  for (let index = 0; index < ownerId.length; index += 1) {
    hash = Math.imul(hash ^ ownerId.charCodeAt(index), 16777619);
  }
  return PLAYER_PALETTES[(hash >>> 0) % PLAYER_PALETTES.length]!;
}
