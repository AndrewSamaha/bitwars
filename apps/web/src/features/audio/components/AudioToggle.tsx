"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { audio } from "@/features/audio/audioManager";

const subscribeToAudio = (notify: () => void) => audio.subscribe(notify);
const getAudioSnapshot = () => audio.getStatus();
const SERVER_AUDIO_STATUS = { muted: true, musicPlaying: false };
const getServerAudioSnapshot = () => SERVER_AUDIO_STATUS;

/** Master music/SFX toggle. Its click is also the user gesture that unlocks audio. */
export function AudioToggle() {
  const { muted, musicPlaying } = useSyncExternalStore(
    subscribeToAudio,
    getAudioSnapshot,
    getServerAudioSnapshot,
  );
  const soundEnabled = !muted && musicPlaying;

  const toggleAudio = useCallback(() => {
    if (soundEnabled) {
      audio.setMuted(true);
      return;
    }

    // Start the Web Audio unlock request and playback while this direct user
    // gesture is still active; do not defer either behind an awaited promise.
    void audio.unlock().catch(() => audio.setMuted(true));
    audio.setMuted(false);
    if (!audio.isPlayingMusic()) audio.playMusic();
  }, [soundEnabled]);

  const Icon = soundEnabled ? Volume2 : VolumeX;
  const label = soundEnabled ? "Mute music and sound effects" : "Enable music and sound effects";

  return (
    <button
      type="button"
      className="pointer-events-auto inline-flex size-6 items-center justify-center rounded text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      aria-label={label}
      title={label}
      onClick={toggleAudio}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}
