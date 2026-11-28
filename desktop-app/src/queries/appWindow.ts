interface ElectronWindowAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized?: () => Promise<boolean>;
  moveBy?: (deltaX: number, deltaY: number) => void;
  onMaximizeChange?: (callback: (isMaximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronWindow?: ElectronWindowAPI;
  }
}

export async function windowMinimize(): Promise<void> {
  if (typeof window !== 'undefined' && window.electronWindow) {
    await window.electronWindow.minimize();
  }
}

export async function windowMaximize(): Promise<void> {
  if (typeof window !== 'undefined' && window.electronWindow) {
    await window.electronWindow.maximize();
    return;
  }
  if (typeof document !== 'undefined') {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  }
}

export async function windowClose(): Promise<void> {
  if (typeof window !== 'undefined' && window.electronWindow) {
    await window.electronWindow.close();
    return;
  }
  if (typeof window !== 'undefined') {
    window.close();
  }
}

export async function windowIsMaximized(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.electronWindow?.isMaximized) {
    return await window.electronWindow.isMaximized();
  }
  if (typeof document !== 'undefined' && document.fullscreenElement) {
    return true;
  }
  return false;
}

export function windowMoveBy(deltaX: number, deltaY: number): void {
  if (typeof window !== 'undefined' && window.electronWindow?.moveBy) {
    window.electronWindow.moveBy(deltaX, deltaY);
  }
}

export function onWindowMaximizeChange(callback: (isMaximized: boolean) => void): () => void {
  if (typeof window !== 'undefined' && window.electronWindow?.onMaximizeChange) {
    return window.electronWindow.onMaximizeChange(callback);
  }
  if (typeof window !== 'undefined') {
    const handler = () => {
      callback(Boolean(document.fullscreenElement));
    };
    window.addEventListener('resize', handler);
    document.addEventListener('fullscreenchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      document.removeEventListener('fullscreenchange', handler);
    };
  }
  return () => {};
}
