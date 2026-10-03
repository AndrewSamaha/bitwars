"use client";

import { useEffect } from "react";
import { BUILD_COMPLETED_EVENT, ENTITY_DETECTED_EVENT, ENTITY_EXPLODED_EVENT, ENTITY_UNDER_ATTACK_EVENT } from "@/features/gamestate/events";
import { audio, SoundEffect } from "@/features/audio/audioManager";

/** Connects semantic game presentation events to their audio responses. */
export default function AudioEventBridge() {
  useEffect(() => {
    let active = true;
    let registered: string[] = [];
    fetch("/api/content/sfx", { cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error("Unable to load sound effects."); return response.json(); })
      .then((data) => {
        if (!active) return;
        registered = (data.effects ?? []).map((effect: { id: string; definition: Parameters<typeof audio.registerSoundEffect>[1] }) => {
          audio.registerSoundEffect(effect.id, effect.definition);
          return effect.id;
        });
      })
      .catch((error) => console.error("Sound effects unavailable:", error));
    const onEntityExploded = () => audio.playSfx(SoundEffect.EntityExplosion);
    const onEntityUnderAttack = () => audio.playSfx(SoundEffect.UnderAttack);
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
    window.addEventListener(ENTITY_UNDER_ATTACK_EVENT, onEntityUnderAttack);
    window.addEventListener(ENTITY_DETECTED_EVENT, onEntityDetected);
    window.addEventListener(BUILD_COMPLETED_EVENT, onBuildCompleted);
    window.addEventListener("bitwars:laser-shot", onLaserShot);
    return () => {
      active = false;
      window.removeEventListener(ENTITY_EXPLODED_EVENT, onEntityExploded);
      window.removeEventListener(ENTITY_UNDER_ATTACK_EVENT, onEntityUnderAttack);
      window.removeEventListener(ENTITY_DETECTED_EVENT, onEntityDetected);
      window.removeEventListener(BUILD_COMPLETED_EVENT, onBuildCompleted);
      window.removeEventListener("bitwars:laser-shot", onLaserShot);
      for (const id of registered) audio.unregisterSfx(id);
    };
  }, []);

  return null;
}
