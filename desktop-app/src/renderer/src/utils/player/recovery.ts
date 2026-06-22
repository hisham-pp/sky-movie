/**
 * Error recovery and fallback strategies
 * Pattern from seanime's stream error handling with retry logic
 */

export type ErrorSeverity = 'recoverable' | 'fatal';

export interface ErrorRecoveryStrategy {
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;

  /**
   * Base delay for exponential backoff (ms)
   */
  baseDelayMs: number;

  /**
   * Maximum delay between retries (ms)
   */
  maxDelayMs: number;

  /**
   * Whether this error is recoverable
   */
  recoverable: boolean;

  /**
   * Fallback action if retries are exhausted
   */
  fallback?: 'external-player' | 'open-file-dialog' | 'show-error';
}

/**
 * Error recovery configurations for different error types
 */
export const ERROR_RECOVERY_STRATEGIES: Record<string, ErrorRecoveryStrategy> = {
  'MEDIA_ERR_ABORTED': {
    maxRetries: 1,
    baseDelayMs: 500,
    maxDelayMs: 2000,
    recoverable: true,
    fallback: 'show-error'
  },
  'MEDIA_ERR_NETWORK': {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    recoverable: true,
    fallback: 'external-player'
  },
  'MEDIA_ERR_DECODE': {
    maxRetries: 0,
    baseDelayMs: 0,
    maxDelayMs: 0,
    recoverable: false,
    fallback: 'external-player'
  },
  'MEDIA_ERR_SRC_NOT_SUPPORTED': {
    maxRetries: 0,
    baseDelayMs: 0,
    maxDelayMs: 0,
    recoverable: false,
    fallback: 'external-player'
  },
  'HTTP_TIMEOUT': {
    maxRetries: 2,
    baseDelayMs: 1000,
    maxDelayMs: 5000,
    recoverable: true,
    fallback: 'show-error'
  },
  'FILE_NOT_FOUND': {
    maxRetries: 0,
    baseDelayMs: 0,
    maxDelayMs: 0,
    recoverable: false,
    fallback: 'show-error'
  }
};

/**
 * Get recovery strategy for an error code
 */
export function getErrorRecoveryStrategy(errorCode: string): ErrorRecoveryStrategy {
  return ERROR_RECOVERY_STRATEGIES[errorCode] || {
    maxRetries: 1,
    baseDelayMs: 1000,
    maxDelayMs: 5000,
    recoverable: true,
    fallback: 'show-error'
  };
}

/**
 * Retry manager with exponential backoff
 */
export class RetryManager {
  private retryCount = 0;
  private strategy: ErrorRecoveryStrategy;

  constructor(errorCode: string) {
    this.strategy = getErrorRecoveryStrategy(errorCode);
  }

  /**
   * Check if another retry should be attempted
   */
  shouldRetry(): boolean {
    return this.retryCount < this.strategy.maxRetries;
  }

  /**
   * Get delay before next retry with exponential backoff
   */
  getNextRetryDelay(): number {
    const exponentialDelay = this.strategy.baseDelayMs * Math.pow(2, this.retryCount);
    const delay = Math.min(exponentialDelay, this.strategy.maxDelayMs);
    this.retryCount++;
    return delay;
  }

  /**
   * Reset retry counter
   */
  reset(): void {
    this.retryCount = 0;
  }

  /**
   * Get current retry count
   */
  getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(): boolean {
    return this.strategy.recoverable;
  }

  /**
   * Get fallback action if retries exhausted
   */
  getFallbackAction(): ErrorRecoveryStrategy['fallback'] {
    return this.strategy.fallback;
  }
}

/**
 * Fallback chain executor
 * Tries multiple recovery options in sequence
 */
export class FallbackChainExecutor {
  /**
   * Execute fallback chain for a playback error
   */
  async executeChain(
    errorCode: string,
    primaryAction: () => Promise<void>,
    fallbackActions: Array<() => Promise<void>>
  ): Promise<void> {
    const actions = [primaryAction, ...fallbackActions];

    for (let i = 0; i < actions.length; i++) {
      try {
        await actions[i]();
        return; // Success
      } catch (error) {
        console.warn(`Fallback action ${i} failed:`, error);
        if (i === actions.length - 1) {
          // Last action failed
          throw new Error(`All fallback actions failed for error ${errorCode}`);
        }
      }
    }
  }
}

/**
 * Codec compatibility checker
 * Helps determine if a codec can be played natively
 */
export class CodecCompatibilityChecker {
  private videoElement: HTMLVideoElement;

  constructor() {
    this.videoElement = document.createElement('video');
  }

  /**
   * Check if codec string is likely supported
   */
  isCodecLikelySupported(codecString: string): boolean {
    if (!codecString) return false;

    // Check common codec patterns
    const unsupportedPatterns = [
      'hevc', // HEVC/H.265 not widely supported on web
      'h265',
      'vp9', // VP9 limited support
      'av1', // AV1 limited support
      'ac-3', // AC3 not supported
      'eac3', // E-AC-3 not supported
      'dts', // DTS not supported
      'truehd', // TrueHD not supported
      'atmos' // Atmos not supported in web players
    ];

    const normalizedCodec = codecString.toLowerCase();
    for (const pattern of unsupportedPatterns) {
      if (normalizedCodec.includes(pattern)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if MIME type can be played
   */
  canPlayType(mimeType: string): 'maybe' | 'probably' | '' {
    try {
      const canPlay = this.videoElement.canPlayType(mimeType);
      return canPlay as 'maybe' | 'probably' | '';
    } catch (error) {
      console.warn('Error checking mime type:', error);
      return '';
    }
  }

  /**
   * Check if HLS playlist can be played (requires HLS.js)
   */
  canPlayHLS(): boolean {
    // Check if HLS.js is available
    return (window as any).HLS !== undefined;
  }

  /**
   * Check if DASH manifest can be played (requires dash.js)
   */
  canPlayDASH(): boolean {
    // Check if dash.js is available
    return (window as any).dashjs !== undefined;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.videoElement.remove();
  }
}
