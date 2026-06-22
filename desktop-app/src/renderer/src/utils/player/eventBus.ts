/**
 * Event-driven player architecture using event bus pattern
 * Ensures non-blocking playback events and decouples components
 * Pattern from seanime's VideoCore
 */

export type VideoEventType =
  | 'video:loading'
  | 'video:loaded'
  | 'video:metadata-loaded'
  | 'video:can-play'
  | 'video:playing'
  | 'video:paused'
  | 'video:resumed'
  | 'video:seeking'
  | 'video:seeked'
  | 'video:time-update'
  | 'video:duration-change'
  | 'video:volume-change'
  | 'video:rate-change'
  | 'video:buffering'
  | 'video:buffered'
  | 'video:ended'
  | 'video:completed' // 92% watched
  | 'video:error'
  | 'video:terminated'
  | 'track:audio-changed'
  | 'track:subtitle-changed'
  | 'player:fullscreen-enter'
  | 'player:fullscreen-exit';

export interface VideoEvent {
  type: VideoEventType;
  timestamp: number;
  data?: any;
}

export interface LoadingEvent extends VideoEvent {
  type: 'video:loading';
  data: {
    progress: number; // 0-100
  };
}

export interface MetadataLoadedEvent extends VideoEvent {
  type: 'video:metadata-loaded';
  data: {
    duration: number;
    width: number;
    height: number;
    tracks: TrackEventData[];
  };
}

export interface TimeUpdateEvent extends VideoEvent {
  type: 'video:time-update';
  data: {
    currentTime: number;
    duration: number;
    progress: number; // 0-100
  };
}

export interface PlaybackStatusEvent extends VideoEvent {
  type: 'video:playing' | 'video:paused';
  data: {
    currentTime: number;
  };
}

export interface ErrorEvent extends VideoEvent {
  type: 'video:error';
  data: {
    code: number;
    message: string;
    recoverable: boolean;
  };
}

export interface TrackEventData {
  number: number;
  type: 'video' | 'audio' | 'subtitle';
  label: string;
  language?: string;
}

export interface TrackChangeEvent extends VideoEvent {
  type: 'track:audio-changed' | 'track:subtitle-changed';
  data: {
    trackNumber: number;
    label: string;
  };
}

/**
 * Type-safe event handler
 */
export type EventHandler<T extends VideoEvent = VideoEvent> = (event: T) => void | Promise<void>;

export type UnsubscribeFn = () => void;

/**
 * Event bus for managing player events in a non-blocking way
 * Events are queued and processed asynchronously to prevent UI freezing
 */
export class PlayerEventBus {
  private subscribers: Map<VideoEventType, Set<EventHandler>> = new Map();
  private eventQueue: VideoEvent[] = [];
  private isProcessing = false;
  private maxQueueSize = 1000;

  /**
   * Subscribe to an event type
   */
  subscribe<T extends VideoEvent = VideoEvent>(
    eventType: VideoEventType | VideoEventType[],
    handler: EventHandler<T>
  ): UnsubscribeFn {
    const types = Array.isArray(eventType) ? eventType : [eventType];

    for (const type of types) {
      if (!this.subscribers.has(type)) {
        this.subscribers.set(type, new Set());
      }
      this.subscribers.get(type)?.add(handler as EventHandler);
    }

    // Return unsubscribe function
    return () => {
      for (const type of types) {
        this.subscribers.get(type)?.delete(handler as EventHandler);
      }
    };
  }

  /**
   * Subscribe to an event once, then auto-unsubscribe
   */
  once<T extends VideoEvent = VideoEvent>(
    eventType: VideoEventType,
    handler: EventHandler<T>
  ): UnsubscribeFn {
    const unsubscribe = this.subscribe(eventType, (event: T) => {
      handler(event);
      unsubscribe();
    });
    return unsubscribe;
  }

  /**
   * Dispatch an event (adds to queue, doesn't block)
   */
  dispatch(event: VideoEvent | Omit<VideoEvent, 'timestamp'>): void {
    const fullEvent: VideoEvent = {
      ...event,
      timestamp: 'timestamp' in event ? event.timestamp : Date.now()
    } as VideoEvent;

    // Queue the event
    if (this.eventQueue.length < this.maxQueueSize) {
      this.eventQueue.push(fullEvent);
    } else {
      console.warn('Event queue full, dropping oldest events');
      this.eventQueue.shift(); // Drop oldest if queue is full
      this.eventQueue.push(fullEvent);
    }

    // Process queue asynchronously
    this.processQueue();
  }

  /**
   * Process queued events asynchronously
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process events in batches to prevent blocking
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (!event) break;

        await this.notifySubscribers(event);

        // Yield to event loop every 10 events
        if (this.eventQueue.length % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Notify all subscribers of an event
   */
  private async notifySubscribers(event: VideoEvent): Promise<void> {
    const handlers = this.subscribers.get(event.type);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const promises: Promise<void>[] = [];

    for (const handler of handlers) {
      try {
        const result = handler(event);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    }

    // Wait for async handlers, but don't let one slow handler block others
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  /**
   * Clear all subscribers
   */
  clear(): void {
    this.subscribers.clear();
    this.eventQueue = [];
  }

  /**
   * Get number of subscribers for a type
   */
  getSubscriberCount(eventType: VideoEventType): number {
    return this.subscribers.get(eventType)?.size ?? 0;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }
}
