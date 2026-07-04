import { bind } from './client';

export const torrentSearch = bind('torrentSearch');
export const torrentAddMagnet = bind('torrentAddMagnet');
export const torrentPause = bind('torrentPause');
export const torrentResume = bind('torrentResume');
export const torrentRemove = bind('torrentRemove');
export const torrentDeleteFiles = bind('torrentDeleteFiles');
export const torrentMove = bind('torrentMove');
export const torrentList = bind('torrentList');
export const torrentStats = bind('torrentStats');
export const torrentGetSettings = bind('torrentGetSettings');
export const torrentUpdateSettings = bind('torrentUpdateSettings');
export const torrentOpenFolder = bind('torrentOpenFolder');
export const torrentRecheck = bind('torrentRecheck');
export const torrentSetPlaybackThrottle = bind('torrentSetPlaybackThrottle');
export const onTorrentProgress = bind('onTorrentProgress');
