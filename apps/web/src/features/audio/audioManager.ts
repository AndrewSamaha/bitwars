"use client";

import { Howl, Howler } from "howler";

export type AudioSource = string | string[];

/** Semantic world states that select a background music track. */
export enum BackgroundMusicState {
  Exploration = "exploration",
}

/** Semantic game events that have a registered sound effect. */
export enum SoundEffect {
  EntityExplosion = "entity-explosion",
  SonarPing = "sonar-ping",
}

const backgroundMusicSources: Record<BackgroundMusicState, AudioSource> = {
  [BackgroundMusicState.Exploration]: "/audio/music/exploration_theme.ogg",
};

const soundEffectDefinitions: Record<SoundEffect, { source: AudioSource; options: SfxOptions }> = {
  [SoundEffect.EntityExplosion]: {
    source: "/audio/sfx/explosion/DeathFlash.flac",
    options: { volume: 0.7, pool: 8 },
  },
  [SoundEffect.SonarPing]: {
    source: "/audio/sfx/sonar_ping/sonarping-38269.mp3",
    options: { volume: 0.65, pool: 2 },
  },
};

type MusicOptions = {
  /** Volume before the music bus is applied, from 0 to 1. */
  volume?: number;
  /** Fade-in duration. Set to 0 when an immediate start is desired. */
  fadeInMs?: number;
};

type SfxOptions = {
  /** Volume before the SFX bus is applied, from 0 to 1. */
  volume?: number;
  /** Number of simultaneous instances this effect may retain for reuse. */
  pool?: number;
};

type RegisteredSfx = {
  sound: Howl;
  sourceVolume: number;
};

export type AudioStatus = {
  muted: boolean;
  musicPlaying: boolean;
};

const clampVolume = (volume: number) => Math.min(1, Math.max(0, volume));

/**
 * Owns the client audio mix. Keep gameplay code semantic: register an effect once,
 * then call `playSfx("explosion")` instead of passing asset URLs around the game.
 *
 * Howler exposes one browser-level output. The music and SFX buses are logical
 * submixes whose levels are applied to their sounds before that master output.
 */
class AudioManager {
  private masterVolume = 1;
  private musicVolume = 0.35;
  private sfxVolume = 0.8;
  private music: Howl | null = null;
  private musicState: BackgroundMusicState | null = null;
  private musicSourceVolume = 1;
  private readonly effects = new Map<string, RegisteredSfx>();
  private muted = false;
  private readonly listeners = new Set<() => void>();
  private status: AudioStatus = { muted: false, musicPlaying: false };

  private emitChange(): void {
    this.status = {
      muted: this.muted,
      musicPlaying: this.music?.playing() === true,
    };
    for (const listener of this.listeners) listener();
  }

  getStatus(): AudioStatus {
    return this.status;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Call directly from a click, tap, or key-submit handler before any await. */
  async unlock(): Promise<void> {
    // Accessing the Howler volume creates its AudioContext when it does not yet
    // exist. Do that inside the gesture too, rather than during module import.
    Howler.volume(this.masterVolume);
    if (Howler.ctx.state !== "running") {
      await Howler.ctx.resume();
    }
    this.emitChange();
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = clampVolume(volume);
    Howler.volume(this.masterVolume);
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = clampVolume(volume);
    this.music?.volume(this.musicSourceVolume * this.musicVolume);
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = clampVolume(volume);
    for (const { sound, sourceVolume } of this.effects.values()) {
      sound.volume(sourceVolume * this.sfxVolume);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    Howler.mute(muted);
    this.emitChange();
  }

  /** Replaces the current music track, fading in the replacement by default. */
  playMusic(
    state: BackgroundMusicState = BackgroundMusicState.Exploration,
    { volume = 1, fadeInMs = 750 }: MusicOptions = {},
  ): void {
    this.stopMusic();

    const sound = new Howl({
      src: backgroundMusicSources[state],
      loop: true,
      preload: true,
      volume: 0,
      onplay: () => this.emitChange(),
      onplayerror: () => this.emitChange(),
      onstop: () => this.emitChange(),
    });
    const id = sound.play();
    const targetVolume = clampVolume(volume) * this.musicVolume;

    if (fadeInMs > 0) {
      sound.fade(0, targetVolume, fadeInMs, id);
    } else {
      sound.volume(targetVolume, id);
    }

    this.music = sound;
    this.musicState = state;
    this.musicSourceVolume = clampVolume(volume);
    this.emitChange();
  }

  /** Stops and releases the active music asset. */
  stopMusic(): void {
    this.music?.stop();
    this.music?.unload();
    this.music = null;
    this.musicState = null;
    this.musicSourceVolume = 1;
    this.emitChange();
  }

  isPlayingMusic(state?: BackgroundMusicState): boolean {
    return this.music?.playing() === true && (state === undefined || state === this.musicState);
  }

  registerSfx(name: string, source: AudioSource, { volume = 1, pool = 5 }: SfxOptions = {}): void {
    this.unregisterSfx(name);
    const sourceVolume = clampVolume(volume);
    const sound = new Howl({
      src: source,
      preload: true,
      pool,
      volume: sourceVolume * this.sfxVolume,
    });

    this.effects.set(name, { sound, sourceVolume });
  }

  /** Registers one of the sound effects declared by the game's audio catalog. */
  registerSoundEffect(effect: SoundEffect): void {
    const { source, options } = soundEffectDefinitions[effect];
    this.registerSfx(effect, source, options);
  }

  unregisterSfx(name: string): void {
    const effect = this.effects.get(name);
    effect?.sound.unload();
    this.effects.delete(name);
  }

  /** Plays one overlapping instance of a previously registered effect. */
  playSfx(name: string): number | undefined {
    return this.effects.get(name)?.sound.play();
  }

  dispose(): void {
    this.stopMusic();
    for (const name of this.effects.keys()) this.unregisterSfx(name);
  }
}

/** One persistent mixer for the lifetime of the browser tab. */
export const audio = new AudioManager();
