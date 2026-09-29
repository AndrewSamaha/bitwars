import { describe, expect, it } from "vitest";
import { GAMEPLAY_SOUND_EFFECTS, validSfxSource, validateSfxDefinition } from "@/features/audio/sfxCatalog";
import { readSfxCatalog, validateSfxFiles } from "@/lib/content/sfxCatalogFile";

describe("SFX catalog", () => {
  it("loads every gameplay sound and resolves its audio files", async () => {
    const { definitions } = await readSfxCatalog();
    expect(Object.keys(definitions)).toEqual(GAMEPLAY_SOUND_EFFECTS);
    await expect(validateSfxFiles(definitions)).resolves.toBeUndefined();
    expect(definitions["laser-shot"].sources).toHaveLength(6);
  });

  it("rejects paths outside the audio library", () => {
    expect(validSfxSource("sfx/laser/laser_01.wav")).toBe(true);
    expect(validSfxSource("../secrets.mp3")).toBe(false);
    expect(validSfxSource("sfx/../music/theme.ogg")).toBe(false);
  });

  it("requires licensing details for assigned files", () => {
    expect(() => validateSfxDefinition({
      name: "Test", sources: ["sfx/test/clip.wav"], volume: 0.5, pool: 2,
      attribution: { artist: "", source: "", license: "", changes: "", retrieved: "" },
    })).toThrow("Artist, source, and license");
  });
});
