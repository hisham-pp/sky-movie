interface ElectronWindowAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
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

