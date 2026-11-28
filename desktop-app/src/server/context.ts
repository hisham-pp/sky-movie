import { ensureAppDataLayout, type AppDataPaths } from '@/lib/paths';
import { getDatabaseContext, type SqliteDatabase } from '@/lib/db/client';
import { CatalogService } from './services/catalogService';
import { SettingsService } from './services/settingsService';
import { PlaylistService } from './services/playlistService';
import { PlayerService } from './services/playerService';
import { MetadataProviderManager } from './services/metadataProvider';
import { LibraryScanner } from './services/libraryScanner';
import { MaintenanceService } from './services/maintenanceService';
import { BackupService } from './services/backupService';
import { LocalSyncEngine } from './services/syncEngine';
import { TorrentManager } from './torrent/TorrentManager';

export interface ServerServices {
  paths: AppDataPaths;
  db: SqliteDatabase;
  catalog: CatalogService;
  settings: SettingsService;
  playlist: PlaylistService;
  player: PlayerService;
  metadata: MetadataProviderManager;
  scanner: LibraryScanner;
  maintenance: MaintenanceService;
  backup: BackupService;
  sync: LocalSyncEngine;
  torrent: TorrentManager;
}

let services: ServerServices | null = null;

export function getServices(): ServerServices {
  if (services) return services;

  const paths = ensureAppDataLayout();
  const { sqlite: db } = getDatabaseContext();

  const settings = new SettingsService(db);
  const catalog = new CatalogService(db);
  const playlist = new PlaylistService(db);
  const player = new PlayerService(db);
  const metadata = new MetadataProviderManager(db, paths, settings);
  const scanner = new LibraryScanner(db);
  const maintenance = new MaintenanceService(db, paths);
  const backup = new BackupService(db, paths);
  const sync = new LocalSyncEngine(db, paths, '0.11.2');
  const torrent = new TorrentManager(paths.root);

  services = {
    paths,
    db,
    catalog,
    settings,
    playlist,
    player,
    metadata,
    scanner,
    maintenance,
    backup,
    sync,
    torrent
  };

  return services;
}
