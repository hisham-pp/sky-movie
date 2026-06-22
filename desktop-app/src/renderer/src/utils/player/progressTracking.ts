/**
 * Watch progress tracking and persistence
 */

import type { PlayMediaResult } from '@shared/ipc';

export const RESUME_START_THRESHOLD_SECONDS = 5;
export const RESUME_END_BUFFER_SECONDS = 10;
export const SAVE_INTERVAL_MS = 10000;

interface ProgressTrackingState {
  lastSavedPosition: number;
  lastSavedAt: number;
  restoredPosition: boolean;
}

/**
 * Initializes progress tracking state
 */
export function initializeProgressTracking(): ProgressTrackingState {
  return {
    lastSavedPosition: -1,
    lastSavedAt: 0,
    restoredPosition: false
  };
}

/**
 * Determines if playback has been completed based on progress
 */
export function isPlaybackCompleted(currentTime: number, duration: number): boolean {
  return duration > 0 && currentTime / duration > 0.92;
}

/**
 * Determines if progress should be saved based on timing and position
 */
export function shouldSaveProgress(
  positionSeconds: number,
  state: ProgressTrackingState,
  force: boolean = false
): boolean {
  if (force) {
    return true;
  }

  const positionChanged = positionSeconds !== state.lastSavedPosition;
  const enoughTimeHasPassed = Date.now() - state.lastSavedAt >= SAVE_INTERVAL_MS;

  return positionChanged && enoughTimeHasPassed;
}

/**
 * Determines if a saved position should be restored based on watch progress
 */
export function shouldRestorePosition(
  player: PlayMediaResult,
  duration: number
): boolean {
  const savedPosition = player.watchProgress?.positionSeconds ?? 0;
  const completed = player.watchProgress?.completed ?? false;

  // Don't restore if already completed
  if (completed) {
    return false;
  }

  // Don't restore if within threshold of start
  if (savedPosition < RESUME_START_THRESHOLD_SECONDS) {
    return false;
  }

  // Don't restore if within buffer of end
  if (duration - savedPosition < RESUME_END_BUFFER_SECONDS) {
    return false;
  }

  return true;
}

/**
 * Calculates the position to resume playback from
 */
export function getResumePosition(
  savedPosition: number,
  duration: number
): number {
  return Math.min(savedPosition, Math.max(duration - RESUME_END_BUFFER_SECONDS, 0));
}
