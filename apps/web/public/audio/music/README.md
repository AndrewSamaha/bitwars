# Background music

Place loop-ready background music files in this directory. They are available to
the client under `/audio/music/<filename>`.

For browser coverage, add both an `.ogg` and `.mp3` version of each track. Add
the filenames to `backgroundMusicSources` in the audio manager, then select the
track by its semantic world state:

```ts
audio.playMusic(BackgroundMusicState.Exploration);
```

Start music only after `audio.unlock()` has been called by a user gesture.
