export async function windowMinimize(): Promise<void> {
  // Web browser alternative: no minimize in standard browser
}

export async function windowMaximize(): Promise<void> {
  if (typeof document !== 'undefined') {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  }
}

export async function windowClose(): Promise<void> {
  if (typeof window !== 'undefined') {
    window.close();
  }
}
