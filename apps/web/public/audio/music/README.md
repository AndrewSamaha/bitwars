# Background music

Place loop-ready background music files in this directory. They are available to
the client under `/audio/music/<filename>`.

For browser coverage, add both an `.ogg` and `.mp3` version of each track, then
pass both to the audio manager in preferred order:

```ts
audio.playMusic([
  "/audio/music/frontier.ogg",
  "/audio/music/frontier.mp3",
]);
```

Start music only after `audio.unlock()` has been called by a user gesture.
