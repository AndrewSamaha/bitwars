"use client";

import { useEffect } from "react";
import { ENTITY_DETECTED_EVENT, ENTITY_EXPLODED_EVENT } from "@/features/gamestate/events";
import { audio, SoundEffect } from "@/features/audio/audioManager";

/** Connects semantic game presentation events to their audio responses. */
export default function AudioEventBridge() {
  useEffect(() => {
    audio.registerSoundEffect(SoundEffect.EntityExplosion);
    audio.registerSoundEffect(SoundEffect.SonarPing);
    const onEntityExploded = () => audio.playSfx(SoundEffect.EntityExplosion);
    let lastSonarAt = Number.NEGATIVE_INFINITY;
    const onEntityDetected = () => {
      const now = performance.now();
      if (now - lastSonarAt < 350) return;
      lastSonarAt = now;
      audio.playSfx(SoundEffect.SonarPing);
    };

    window.addEventListener(ENTITY_EXPLODED_EVENT, onEntityExploded);
    window.addEventListener(ENTITY_DETECTED_EVENT, onEntityDetected);
    return () => {
      window.removeEventListener(ENTITY_EXPLODED_EVENT, onEntityExploded);
      window.removeEventListener(ENTITY_DETECTED_EVENT, onEntityDetected);
      audio.unregisterSfx(SoundEffect.EntityExplosion);
      audio.unregisterSfx(SoundEffect.SonarPing);
    };
  }, []);

  return null;
}
