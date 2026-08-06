import * as queries from '@renderer/queries';
import type { PlayMediaResult } from '@shared/ipc';

export function savePlaybackProgress(
  player: PlayMediaResult,
  positionSeconds: number,
  durationSeconds: number,
  completed: boolean,
) {
  if (player.playbackKind === 'torrent' && player.torrentId && player.torrentFilePath) {
    return queries.torrentUpdateStreamProgress({
      torrentId: player.torrentId,
      filePath: player.torrentFilePath,
      positionSeconds,
      durationSeconds,
      completed,
    });
  }

  return queries.updateWatchProgress({
    mediaFileId: player.mediaFileId,
    positionSeconds,
    durationSeconds,
    completed,
  });
}
