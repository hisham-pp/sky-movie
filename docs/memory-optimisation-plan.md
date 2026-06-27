# Memory Optimisation Plan — Sky Movie

> Status: **COMPLETE** (Task 4 deferred — see notes)  
> Created: 2026-06-27

---

## Problem Summary

Sky Movie is an Electron app with a React 19 renderer, SQLite backend, native mpv player, and an FFmpeg-based streaming server.
As a user's library grows the app has several places where memory grows unboundedly or is wasted.

The issues fall into four layers:

| Layer | Severity | Description |
|-------|----------|-------------|
| Renderer – library state | High | All movies/shows loaded flat into `useLibraryController` at startup |
| Renderer – image loading | Medium | Movie tile `<img>` tags have no `loading="lazy"` attribute |
| Renderer – search | Low | `SearchModal` re-filters all items on every keystroke without virtualization |
| Backend – watch history | Medium | `watch_history` rows are never pruned; one row per completion event |
| Backend – streaming temp files | Medium | LRU eviction only runs at server start, not during a session |
| Backend – SQLite overhead | Low | No periodic WAL checkpoint; DB can accumulate WAL bloat during long sessions |
| Backend – completed torrents | Low | Completed torrent list is never capped |

---

## Optimisation Tasks

### Task 1 — Lazy-load movie/show poster images
**File:** `desktop-app/src/renderer/src/components/LibraryTile.tsx`  
**Lines:** 19, 57

**Problem:** Every `<img>` tag for movie/show posters loads eagerly. With 100 tiles visible at once the browser requests all 100 images simultaneously on initial render.

**Fix:** Add `loading="lazy"` and `decoding="async"` to both `<img>` elements.

```diff
- {movie.posterPath ? <img src={movie.posterPath} alt="" /> : <Film size={34} />}
+ {movie.posterPath ? <img src={movie.posterPath} alt="" loading="lazy" decoding="async" /> : <Film size={34} />}
```

**Impact:** Reduces initial image decode memory and network pressure. Immediate win, zero risk.

---

### Task 2 — Auto-prune watch history in the database
**File:** `desktop-app/src/main/services/playerService.ts`  
**Lines:** 201–205

**Problem:** Every time a media file is marked `completed` a row is inserted into `watch_history` with no cap. A user who watches the same film 50 times will have 50 rows.

**Fix:** After the `INSERT` into `watch_history`, delete rows for that `media_file_id` beyond the most-recent 10.

```sql
DELETE FROM watch_history
WHERE media_file_id = ?
  AND id NOT IN (
    SELECT id FROM watch_history
    WHERE media_file_id = ?
    ORDER BY watched_at DESC
    LIMIT 10
  );
```

**Impact:** Bounds the history table to `num_media_files × 10` rows. Prevents unbounded SQLite growth.

---

### Task 3 — Run streaming-server temp-file cleanup periodically
**File:** `desktop-app/src/main/services/streamingServer.ts`  
**Lines:** 105–132

**Problem:** `cleanOldTempFiles()` is called only once at server startup. A user who watches many films in a single session can accumulate multiple gigabytes of FFmpeg output before the LRU cap kicks in, and the cap itself is only enforced at the next restart.

**Fix:** Call `cleanOldTempFiles()` on a timer (every 30 minutes) while the server is running.

```ts
// inside start():
const cleanupInterval = setInterval(() => this.cleanOldTempFiles(), 30 * 60 * 1000);
this.server!.on('close', () => clearInterval(cleanupInterval));
```

**Impact:** Ensures the 2 GB cap is enforced during long sessions rather than only at startup.

---

### Task 4 — Trim large fields from library list queries ⚠️ DEFERRED
**File:** `desktop-app/src/main/services/catalogService.ts`

**Problem:** `getMovies()` returns full objects including `overview` (500+ chars). With 1 000+ items this adds megabytes to the renderer heap for data the list view rarely renders.

**Why deferred:** The `BrowseMoviesPage` banner carousel shows `movie.overview` for whichever movie is currently featured — including non-selected movies pulled from the list array. Stripping `overview` from the list query would blank the banner text for carousel items that are not the `selectedMovie`. A safe fix requires a `MovieListItem` type (smaller) vs `Movie` type (full) split across the IPC contract and the banner fetch logic — a non-trivial refactor.

**Suggested future approach:**
- Introduce `MovieListItem` in `shared/ipc.ts` omitting `overview` and `originalTitle`.
- `getMovies()` returns `MovieListItem[]`; `useLibraryController.movies` typed as `MovieListItem[]`.
- `BrowseMoviesPage` banner fetches the full record via `getMovieById` on carousel advance.
- `selectedMovie` remains typed as `Movie` (full), sourced from `getMovieById`.

**Impact when done:** ~40–60% heap reduction for renderer library state in large libraries.

---

### Task 5 — Cap completed torrents list
**File:** `desktop-app/src/main/torrent/TorrentManager.ts`

**Problem:** Completed torrents are persisted to a JSON file and loaded into memory on every startup. This list is never capped; after years of use it will grow arbitrarily.

**Fix:** When persisting completed torrents, keep only the most-recent 200 entries sorted by completion date.

```ts
this.completedTorrents = this.completedTorrents.slice(-200);
```

**Impact:** Bounds in-memory and on-disk completed-torrent state.

---

### Task 6 — Add SQLite WAL checkpoint on idle
**File:** `desktop-app/src/main/index.ts` or `database/client.ts`

**Problem:** SQLite in WAL mode accumulates a write-ahead log that is only fully checkpointed when the connection closes. During a long session the WAL file can grow to hundreds of MB if many scans or history writes have occurred.

**Fix:** Run a passive checkpoint every 15 minutes when the app is not scanning.

```ts
setInterval(() => {
  db.pragma('wal_checkpoint(PASSIVE)');
}, 15 * 60 * 1000);
```

**Impact:** Keeps the WAL file small and reduces memory-mapped file pressure on the OS.

---

## Implementation Order

| # | Task | Effort | Risk | Status |
|---|------|--------|------|--------|
| 1 | Lazy-load images | 5 min | None | ✅ Done |
| 3 | Periodic temp cleanup | 15 min | None | ✅ Done |
| 2 | Watch history pruning | 20 min | Low | ✅ Done |
| 5 | Cap completed torrents | 15 min | Low | ✅ Done |
| 6 | SQLite WAL checkpoint | 20 min | Low | ✅ Done |
| 4 | Trim list query fields | 1–2 h | Medium | ⏳ Deferred |

---

## Out of Scope (future work)

- **Virtual scrolling** for the poster grid (`react-window`/`react-virtual`). Current load-more pagination (100 items) is acceptable for most libraries. Worth revisiting if libraries exceed 5 000 items.
- **Server-side pagination** for `getMovies`/`getShows`. Requires changes to both the IPC contract and renderer filtering logic. High effort for marginal gain unless the library is very large.
- **Worker thread for library scanning**. Scanning currently blocks the main SQLite connection. Low priority since scanning is an infrequent operation.
