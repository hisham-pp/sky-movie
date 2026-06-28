import { app, BrowserWindow, net } from 'electron';
import { createWriteStream, unlink } from 'node:fs';
import { mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReleaseInfo, UpdateCheckResult, UpdateDownloadProgress, UpdateStatus } from '../../shared/ipc';
import { ipcChannels } from '../../shared/ipc';
import type { SettingsService } from './settingsService';

const RELEASES_URL = 'https://sky-movie-website.vercel.app/releases.json';
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

interface ReleasesJson {
  latestVersion: string;
  releases: Array<{
    version: string;
    releasedAt: string;
    notes: string;
    changes: string[];
    artifacts: Array<{
      platform: string;
      arch: string;
      kind: string;
      fileName: string;
      size: number;
      downloadUrl: string;
      webViewUrl: string;
    }>;
  }>;
}

export class UpdateService {
  private status: UpdateStatus = 'idle';
  private checkInterval: NodeJS.Timeout | null = null;
  private lastNotifiedVersion: string | null = null;
  private getMainWindow: () => BrowserWindow | null;
  private currentReleaseInfo: ReleaseInfo | null = null;
  private downloadedFilePath: string | null = null;
  private settingsService: SettingsService;

  constructor(getMainWindow: () => BrowserWindow | null, settingsService: SettingsService) {
    this.getMainWindow = getMainWindow;
    this.settingsService = settingsService;
    this.loadLastNotifiedVersion();
    this.restoreDownloadedState();
  }

  private async restoreDownloadedState(): Promise<void> {
    try {
      const updatesDir = join(app.getPath('userData'), 'updates');
      const files = await readdir(updatesDir);
      const installer = files.find((f) => f.endsWith('.exe') || f.endsWith('.dmg') || f.endsWith('.AppImage'));
      if (installer) {
        this.downloadedFilePath = join(updatesDir, installer);
        this.status = 'downloaded';
      }
    } catch {
      // No updates dir yet
    }
  }

  private async cleanupUpdatesDir(): Promise<void> {
    try {
      const updatesDir = join(app.getPath('userData'), 'updates');
      const files = await readdir(updatesDir);
      await Promise.all(files.map((f) => rm(join(updatesDir, f), { force: true })));
    } catch {
      // Nothing to clean
    }
  }

  startPeriodicChecks(): void {
    if (this.checkInterval) {
      return;
    }

    // Check immediately on start
    this.checkForUpdates(true);

    // Then check periodically
    this.checkInterval = setInterval(() => {
      this.checkForUpdates(true);
    }, CHECK_INTERVAL_MS);
  }

  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async checkForUpdates(silent = false): Promise<UpdateCheckResult> {
    this.status = 'checking';
    this.sendStatus();

    try {
      const currentVersion = app.getVersion();
      const releaseInfo = await this.fetchLatestRelease();

      if (!releaseInfo) {
        this.status = 'idle';
        this.sendStatus();
        return {
          hasUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          releaseInfo: null
        };
      }

      const hasUpdate = this.compareVersions(releaseInfo.version, currentVersion) > 0;
      this.currentReleaseInfo = releaseInfo;

      this.status = 'idle';
      this.sendStatus();

      const result: UpdateCheckResult = {
        hasUpdate,
        currentVersion,
        latestVersion: releaseInfo.version,
        releaseInfo: hasUpdate ? releaseInfo : null
      };

      // Notify user if there's an update and we haven't notified about this version yet
      if (hasUpdate && !silent && releaseInfo.version !== this.lastNotifiedVersion) {
        this.notifyUpdateAvailable(releaseInfo);
        this.lastNotifiedVersion = releaseInfo.version;
        await this.saveLastNotifiedVersion();

        // Auto-download (but NOT auto-install) if setting is enabled
        const settings = this.settingsService.getSettings();
        if (settings.autoDownloadUpdates) {
          this.downloadUpdate().catch((error) => {
            console.error('Auto-download failed:', error);
          });
        }
      }

      return result;
    } catch (error) {
      this.status = 'error';
      this.sendStatus();
      console.error('Failed to check for updates:', error);
      return {
        hasUpdate: false,
        currentVersion: app.getVersion(),
        latestVersion: app.getVersion(),
        releaseInfo: null
      };
    }
  }

  async downloadUpdate(): Promise<void> {
    if (!this.currentReleaseInfo) {
      throw new Error('No update available to download');
    }
    if (this.status === 'downloading' || this.status === 'downloaded') return;

    // Clean up any previously downloaded installer before starting a fresh download
    await this.cleanupUpdatesDir();
    this.downloadedFilePath = null;

    this.status = 'downloading';
    this.sendStatus();

    try {
      this.downloadedFilePath = await this.fetchUpdateFile(this.currentReleaseInfo);
      this.status = 'downloaded';
      this.sendStatus();
    } catch (error) {
      this.status = 'error';
      this.sendStatus();
      throw error;
    }
  }

  async installUpdate(): Promise<void> {
    if (!this.downloadedFilePath) {
      throw new Error('No downloaded update to install');
    }

    this.status = 'installing';
    this.sendStatus();

    try {
      await this.runInstaller(this.downloadedFilePath);
    } catch (error) {
      this.status = 'error';
      this.sendStatus();
      throw error;
    }
  }

  getStatus(): UpdateStatus {
    return this.status;
  }

  async dismissUpdateNotification(): Promise<void> {
    if (this.currentReleaseInfo) {
      this.lastNotifiedVersion = this.currentReleaseInfo.version;
      await this.saveLastNotifiedVersion();
    }
  }

  private async fetchLatestRelease(): Promise<ReleaseInfo | null> {
    return new Promise((resolve, reject) => {
      const request = net.request(RELEASES_URL);

      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const json: ReleasesJson = JSON.parse(data);
            const platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux';
            const arch = process.arch === 'x64' ? 'x64' : process.arch === 'arm64' ? 'arm64' : 'ia32';
            const kind = platform === 'windows' ? 'installer' : platform === 'macos' ? 'dmg' : 'appimage';

            const latestRelease = json.releases.find((r) => r.version === json.latestVersion);
            if (!latestRelease) {
              resolve(null);
              return;
            }

            const artifact = latestRelease.artifacts.find(
              (a) => a.platform === platform && a.arch === arch && a.kind === kind
            );

            if (!artifact) {
              resolve(null);
              return;
            }

            resolve({
              version: latestRelease.version,
              releasedAt: latestRelease.releasedAt,
              notes: latestRelease.notes,
              changes: latestRelease.changes,
              downloadUrl: artifact.downloadUrl,
              webViewUrl: artifact.webViewUrl,
              size: artifact.size
            });
          } catch (error) {
            reject(error);
          }
        });
      });

      request.on('error', reject);
      request.end();
    });
  }

  private async fetchUpdateFile(releaseInfo: ReleaseInfo): Promise<string> {
    const updatesDir = join(app.getPath('userData'), 'updates');
    await mkdir(updatesDir, { recursive: true });

    const urlParts: string[] = releaseInfo.downloadUrl.split('/');
    const fileName: string = urlParts.length > 0 ? urlParts[urlParts.length - 1] : 'update.exe';
    const filePath = join(updatesDir, fileName);

    return new Promise((resolve, reject) => {
      const request = net.request({ url: releaseInfo.downloadUrl, redirect: 'follow' });
      const fileStream = createWriteStream(filePath);
      let bytesDownloaded = 0;
      let settled = false;

      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        fileStream.destroy();
        unlink(filePath, () => {});
        reject(error);
      };

      fileStream.on('finish', () => {
        if (settled) return;
        settled = true;
        resolve(filePath);
      });

      fileStream.on('error', fail);

      // Follow redirects (GitHub release URLs redirect to CDN)
      request.on('redirect', () => {
        request.followRedirect();
      });

      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          fail(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        const contentLength = response.headers['content-length'];
        const totalBytes = parseInt(Array.isArray(contentLength) ? contentLength[0] : (contentLength || '0'), 10);

        response.on('data', (chunk: Buffer) => {
          bytesDownloaded += chunk.length;
          fileStream.write(chunk);

          this.sendProgress({
            bytesDownloaded,
            totalBytes,
            percentage: totalBytes > 0 ? (bytesDownloaded / totalBytes) * 100 : 0
          });
        });

        response.on('end', () => {
          fileStream.end();
        });

        response.on('error', (err: Error) => fail(err));
      });

      request.on('error', (err: Error) => fail(err));

      request.end();
    });
  }

  private async runInstaller(filePath: string): Promise<void> {
    const window = this.getMainWindow();
    if (!window) {
      throw new Error('Main window not available');
    }

    // For Windows, we'll use the installer to update
    // For other platforms, we'll open the download location
    if (process.platform === 'win32') {
      const { shell } = await import('electron');
      const result = await shell.openPath(filePath);
      if (result && typeof result === 'string' && result.length > 0) {
        console.error('Failed to open installer:', result);
      }
      // Quit after a short delay so the OS has time to hand off to the installer
      // before the process exits. Do NOT delete the file — the installer needs it.
      setTimeout(() => app.quit(), 1500);
    } else {
      const { shell } = await import('electron');
      shell.showItemInFolder(filePath);
      // For non-Windows platforms, delete the file after a delay
      // to give the user time to see it in the folder
      setTimeout(() => {
        this.deleteDownloadedFile(filePath);
      }, 5000);
    }
  }

  private deleteDownloadedFile(filePath: string): void {
    unlink(filePath, (error) => {
      if (error) {
        console.error('Failed to delete downloaded update file:', error);
      } else {
        console.log('Successfully deleted downloaded update file:', filePath);
      }
    });
  }

  private notifyUpdateAvailable(releaseInfo: ReleaseInfo): void {
    const window = this.getMainWindow();
    if (!window) {
      return;
    }

    window.webContents.send(ipcChannels.updateProgress, {
      type: 'update-available',
      version: releaseInfo.version,
      notes: releaseInfo.notes
    });
  }

  private sendStatus(): void {
    const window = this.getMainWindow();
    if (!window) {
      return;
    }

    window.webContents.send(ipcChannels.updateProgress, {
      type: 'status',
      status: this.status
    });
  }

  private sendProgress(progress: UpdateDownloadProgress): void {
    const window = this.getMainWindow();
    if (!window) {
      return;
    }

    window.webContents.send(ipcChannels.updateProgress, {
      type: 'download-progress',
      ...progress
    });
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }

    return 0;
  }

  private async loadLastNotifiedVersion(): Promise<void> {
    try {
      const { readFile } = await import('node:fs/promises');
      const filePath = join(app.getPath('userData'), 'last-notified-version.txt');
      const content = await readFile(filePath, 'utf-8');
      this.lastNotifiedVersion = content.trim();
    } catch {
      // File doesn't exist yet, that's fine
      this.lastNotifiedVersion = null;
    }
  }

  private async saveLastNotifiedVersion(): Promise<void> {
    if (!this.lastNotifiedVersion) {
      return;
    }

    try {
      const { writeFile } = await import('node:fs/promises');
      const filePath = join(app.getPath('userData'), 'last-notified-version.txt');
      await writeFile(filePath, this.lastNotifiedVersion, 'utf-8');
    } catch (error) {
      console.error('Failed to save last notified version:', error);
    }
  }
}
