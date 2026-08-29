"use client";

import { useEffect } from "react";
import { ENTITY_EXPLODED_EVENT } from "@/features/gamestate/events";
import { audio, SoundEffect } from "@/features/audio/audioManager";

/** Connects semantic game presentation events to their audio responses. */
export default function AudioEventBridge() {
  useEffect(() => {
    audio.registerSoundEffect(SoundEffect.EntityExplosion);
    const onEntityExploded = () => audio.playSfx(SoundEffect.EntityExplosion);

    window.addEventListener(ENTITY_EXPLODED_EVENT, onEntityExploded);
    return () => {
      window.removeEventListener(ENTITY_EXPLODED_EVENT, onEntityExploded);
      audio.unregisterSfx(SoundEffect.EntityExplosion);
    };
  }, []);

  return null;
}
