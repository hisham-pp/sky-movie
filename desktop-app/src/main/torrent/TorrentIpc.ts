import { ipcMain } from 'electron';
import { ipcChannels } from '../../shared/ipc';
import type { AddMagnetRequest, TorrentMoveRequest, TorrentSearchRequest, TorrentSettings } from '../../shared/ipc';
import type { TorrentManager } from './TorrentManager';
import type { BrowserWindow } from 'electron';

function safe<T>(channel: string, fn: () => Promise<T> | T): Promise<T> {
  return Promise.resolve()
    .then(fn)
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[TorrentIPC][${channel}]`, msg);
      throw new Error(msg);
    });
}

export function registerTorrentIpcHandlers(
  manager: TorrentManager,
  getWindow: () => BrowserWindow | null
): void {
  const h = ipcMain.handle.bind(ipcMain);

  // Search is pure HTTP — no engine boot needed.
  h(ipcChannels.torrentSearch, (_e, req: TorrentSearchRequest) =>
    safe(ipcChannels.torrentSearch, () => manager.search(req))
  );

  // Settings read is synchronous — no engine boot needed.
  h(ipcChannels.torrentGetSettings, () =>
    safe(ipcChannels.torrentGetSettings, () => manager.getSettings())
  );

  // List and stats return immediately (empty) if engine not started yet.
  h(ipcChannels.torrentList, () =>
    safe(ipcChannels.torrentList, () => manager.list())
  );

  h(ipcChannels.torrentStats, () =>
    safe(ipcChannels.torrentStats, () => manager.stats())
  );

  // Everything below boots the engine on first call.
  h(ipcChannels.torrentAddMagnet, (_e, req: AddMagnetRequest) =>
    safe(ipcChannels.torrentAddMagnet, () => manager.addMagnet(req))
  );

  h(ipcChannels.torrentPause, (_e, id: string) =>
    safe(ipcChannels.torrentPause, () => manager.pause(id))
  );

  h(ipcChannels.torrentResume, (_e, id: string) =>
    safe(ipcChannels.torrentResume, () => manager.resume(id))
  );

  h(ipcChannels.torrentRemove, (_e, id: string) =>
    safe(ipcChannels.torrentRemove, () => manager.remove(id))
  );

  h(ipcChannels.torrentDeleteFiles, (_e, id: string) =>
    safe(ipcChannels.torrentDeleteFiles, () => manager.deleteFiles(id))
  );

  h(ipcChannels.torrentMove, (_e, req: TorrentMoveRequest) =>
    safe(ipcChannels.torrentMove, () => { manager.move(req); })
  );

  h(ipcChannels.torrentUpdateSettings, (_e, settings: Partial<TorrentSettings>) =>
    safe(ipcChannels.torrentUpdateSettings, () => manager.updateSettings(settings))
  );

  h(ipcChannels.torrentOpenFolder, (_e, id: string) =>
    safe(ipcChannels.torrentOpenFolder, () => { manager.openFolder(id); })
  );

  h(ipcChannels.torrentRecheck, (_e, id: string) =>
    safe(ipcChannels.torrentRecheck, () => manager.recheck(id))
  );

  h(ipcChannels.torrentSetPlaybackThrottle, (_e, active: boolean) =>
    safe(ipcChannels.torrentSetPlaybackThrottle, () => { manager.setPlaybackThrottle(active); })
  );

  // Push progress events from main → renderer (registered once, works before/after engine boot)
  manager.onProgress((info) => {
    const win = getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(ipcChannels.torrentProgress, info);
    }
  });
}
