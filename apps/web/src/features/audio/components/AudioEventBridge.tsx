"use client";

import { useEffect } from "react";
import { BUILD_COMPLETED_EVENT, ENTITY_DETECTED_EVENT, ENTITY_EXPLODED_EVENT } from "@/features/gamestate/events";
import { audio, SoundEffect } from "@/features/audio/audioManager";

/** Connects semantic game presentation events to their audio responses. */
export default function AudioEventBridge() {
  useEffect(() => {
    audio.registerSoundEffect(SoundEffect.EntityExplosion);
    audio.registerSoundEffect(SoundEffect.SonarPing);
    audio.registerSoundEffect(SoundEffect.BuildComplete);
    audio.registerSoundEffect(SoundEffect.LaserShot);
    const onEntityExploded = () => audio.playSfx(SoundEffect.EntityExplosion);
    let lastSonarAt = Number.NEGATIVE_INFINITY;
    const onEntityDetected = () => {
      const now = performance.now();
      if (now - lastSonarAt < 350) return;
      lastSonarAt = now;
      audio.playSfx(SoundEffect.SonarPing);
    };
    const onBuildCompleted = () => audio.playSfx(SoundEffect.BuildComplete);
    const onLaserShot = () => audio.playSfx(SoundEffect.LaserShot);

    window.addEventListener(ENTITY_EXPLODED_EVENT, onEntityExploded);
    window.addEventListener(ENTITY_DETECTED_EVENT, onEntityDetected);
    window.addEventListener(BUILD_COMPLETED_EVENT, onBuildCompleted);
    window.addEventListener("bitwars:laser-shot", onLaserShot);
    return () => {
      window.removeEventListener(ENTITY_EXPLODED_EVENT, onEntityExploded);
      window.removeEventListener(ENTITY_DETECTED_EVENT, onEntityDetected);
      window.removeEventListener(BUILD_COMPLETED_EVENT, onBuildCompleted);
      window.removeEventListener("bitwars:laser-shot", onLaserShot);
      audio.unregisterSfx(SoundEffect.EntityExplosion);
      audio.unregisterSfx(SoundEffect.SonarPing);
      audio.unregisterSfx(SoundEffect.BuildComplete);
      audio.unregisterSfx(SoundEffect.LaserShot);
    };
  }, []);

  return null;
}
