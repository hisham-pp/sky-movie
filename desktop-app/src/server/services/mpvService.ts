export class MpvService {
  isAvailable = false;
  onSessionActiveChange?: (active: boolean) => void;
  openFile(): void {}
  closeSession(): void {}
  play(): void {}
  pause(): void {}
  seek(): void {}
  setVolume(): void {}
  setAudioTrack(): void {}
  setSubTrack(): void {}
  setSpeed(): void {}
  setRenderSize(): void {}
  setSubFile(): void {}
  setAudioFilter(): void {}
}

const mpvService = new MpvService();
export default mpvService;
