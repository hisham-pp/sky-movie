/**
 * Player configuration and initialization
 */

import type { Setting, SettingOption } from './types';
import {
  handleAudioTrackSelection,
  handleSubtitleTrackSelection
} from './trackManagement';

/**
 * Audio context management for handling autoplay policies
 */
export class AudioContextManager {
  private context: AudioContext | null = null;

  /**
   * Creates or gets the audio context
   */
  getContext(): AudioContext | null {
    if (this.context) {
      return this.context;
    }

    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.context = new AudioContextClass();
      }
    } catch (error) {
      console.warn('Failed to create AudioContext:', error);
    }

    return this.context;
  }

  /**
   * Resumes the audio context if suspended
   */
  resumeIfSuspended(): void {
    const context = this.getContext();
    if (context && context.state === 'suspended') {
      context.resume().catch((error) => {
        console.warn('Failed to resume audio context:', error);
      });
    }
  }

  /**
   * Closes the audio context
   */
  close(): void {
    if (this.context) {
      this.context.close().catch(() => {});
      this.context = null;
    }
  }
}

/**
 * Creates the audio track setting configuration
 */
export function createAudioTrackSetting(artplayer: any): Setting {
  return {
    html: 'Audio Track',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    selector: [
      {
        html: 'Default',
        value: 'default',
        default: true
      }
    ],
    onSelect: function (item: SettingOption) {
      const video = artplayer.video;
      handleAudioTrackSelection(video, item.value);
      return item.html;
    }
  };
}

/**
 * Creates the subtitle setting configuration
 */
export function createSubtitleSetting(artplayer: any): Setting {
  return {
    html: 'Subtitle',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M17 3H7a2 2 0 0 0-2 2v3h14V5a2 2 0 0 0-2-2Z"/><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M9 16h6"/></svg>',
    selector: [
      {
        html: 'Off',
        value: 'off',
        default: true
      }
    ],
    onSelect: function (item: SettingOption) {
      const video = artplayer.video;
      handleSubtitleTrackSelection(video, item.value);
      return item.html;
    }
  };
}

/**
 * Base Artplayer configuration options
 */
export function getBasePlayerConfig(containerElement: HTMLElement, mediaUrl: string) {
  return {
    container: containerElement,
    url: mediaUrl,
    theme: '#89ceff',
    volume: 1.0,
    autoplay: false,
    pip: true,
    mutex: true,
    hotkey: true,
    setting: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    miniProgressBar: true,
    screenshot: true,
    flip: true,
    // @ts-ignore - rotate is valid but not in type definitions
    rotate: true,
    moreVideoAttr: {
      preload: 'auto',
      playsInline: true,
      'webkit-playsinline': 'true',
      'x5-playsinline': 'true'
    }
  };
}
