import { afterEach, expect, it, vi } from "vitest";

const { howls } = vi.hoisted(() => ({
  howls: [] as Array<{ src: string | string[]; play: ReturnType<typeof vi.fn> }>,
}));

vi.mock("howler", () => ({
  Howl: class {
    src: string | string[];
    play = vi.fn(() => 1);
    unload = vi.fn();
    volume = vi.fn();

    constructor(options: { src: string | string[] }) {
      this.src = options.src;
      howls.push(this);
    }
  },
  Howler: {},
}));

import { audio, SoundEffect } from "@/features/audio/audioManager";

afterEach(() => {
  audio.unregisterSfx(SoundEffect.LaserShot);
  howls.length = 0;
  vi.restoreAllMocks();
});

it("chooses a laser shot variant at random", () => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  audio.registerSoundEffect(SoundEffect.LaserShot);
  audio.playSfx(SoundEffect.LaserShot);

  expect(howls.map(({ src }) => src)).toEqual(
    [1, 2, 3, 4, 5, 6].map((number) =>
      `/audio/sfx/laser/laser_${String(number).padStart(2, "0")}.wav`),
  );
  expect(howls[3]?.play).toHaveBeenCalledOnce();
});
