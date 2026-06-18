# Local Sync Format

The MVP exports portable local sync folders named `movie-library-sync/`.

```text
movie-library-sync/
  manifest.json
  database-export.jsonl
  movies/
  shows/
  posters/
  backdrops/
  subtitles/
  files/
```

`manifest.json` stores sync version, app version, sync date, source device id, sync type, filters, item count, file count, total size, and checksum summary.

`database-export.jsonl` stores one JSON object per line so large libraries can be streamed without loading the full export into memory.
