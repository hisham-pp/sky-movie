/**
 * Media error handling and diagnostics
 */

import type { ExtendedHTMLVideoElement, PlaybackErrorDetails } from './types';

/**
 * Analyzes a playback error and determines its type
 */
export function analyzePlaybackError(
  video: ExtendedHTMLVideoElement | null
): PlaybackErrorDetails {
  const error = video?.error;

  if (!error) {
    return {
      code: undefined,
      message: undefined,
      type: 'unknown'
    };
  }

  let type: PlaybackErrorDetails['type'] = 'unknown';

  if (
    error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ||
    error.code === MediaError.MEDIA_ERR_DECODE
  ) {
    type = 'unsupported-codec';
  } else if (error.code === MediaError.MEDIA_ERR_NETWORK) {
    type = 'network';
  } else if (error.code === MediaError.MEDIA_ERR_ABORTED) {
    type = 'aborted';
  }

  return {
    code: error.code,
    message: error.message,
    type
  };
}

/**
 * Generates a user-friendly error message based on the playback error
 */
export function getPlaybackErrorMessage(errorDetails: PlaybackErrorDetails): string {
  let message = 'The built-in player cannot decode this file. ';

  switch (errorDetails.type) {
    case 'unsupported-codec':
      message +=
        'Video codec (HEVC/x265) or audio codec (AC3/E-AC-3/EAC3/Atmos/DTS/TrueHD/AAC-HE) may not be supported. ';
      break;
    case 'network':
      message = 'Network error loading video. The file may be corrupted or inaccessible. ';
      break;
    case 'aborted':
      message = 'Video loading was aborted. ';
      break;
    case 'unknown':
    default:
      // Use default message
      break;
  }

  message += 'Try the system player or restart the app after the update.';

  return message;
}

/**
 * Logs detailed playback error information for debugging
 */
export function logPlaybackError(video: ExtendedHTMLVideoElement | null): void {
  const errorDetails = analyzePlaybackError(video);

  console.error('Playback error:', {
    errorCode: errorDetails.code,
    errorType: errorDetails.type,
    errorMessage: errorDetails.message,
    mediaErrorCodes: {
      MEDIA_ERR_ABORTED: errorDetails.code === MediaError.MEDIA_ERR_ABORTED,
      MEDIA_ERR_NETWORK: errorDetails.code === MediaError.MEDIA_ERR_NETWORK,
      MEDIA_ERR_DECODE: errorDetails.code === MediaError.MEDIA_ERR_DECODE,
      MEDIA_ERR_SRC_NOT_SUPPORTED: errorDetails.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
    },
    videoState: {
      src: video?.src,
      readyState: video?.readyState,
      networkState: video?.networkState,
      muted: video?.muted,
      volume: video?.volume
    }
  });
}
