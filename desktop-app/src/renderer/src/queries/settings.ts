import { bind } from './client';

export const getSettings = bind('getSettings');
export const updateSettings = bind('updateSettings');
export const exportLibrary = bind('exportLibrary');
export const importLibrary = bind('importLibrary');
export const syncLibrary = bind('syncLibrary');
export const clearLocalLibraryData = bind('clearLocalLibraryData');
export const createBackup = bind('createBackup');
export const restoreBackup = bind('restoreBackup');
export const checkForUpdates = bind('checkForUpdates');
export const downloadUpdate = bind('downloadUpdate');
export const installUpdate = bind('installUpdate');
export const getUpdateStatus = bind('getUpdateStatus');
export const dismissUpdateNotification = bind('dismissUpdateNotification');
export const onUpdateProgress = bind('onUpdateProgress');
