import type {
  AppSettings,
  Episode,
  LibraryFolder,
  MediaFile,
  Movie,
  TvShow
} from '../../shared/ipc';

type Row = Record<string, unknown>;

const bool = (value: unknown): boolean => Number(value) === 1;
const nullableNumber = (value: unknown): number | null => (value == null ? null : Number(value));
const nullableString = (value: unknown): string | null => (value == null ? null : String(value));

export function mapLibraryFolder(row: Row): LibraryFolder {
  return {
    id: Number(row.id),
    path: String(row.path),
    name: String(row.name),
    mediaKind: row.media_kind as LibraryFolder['mediaKind'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export function mapMovie(row: Row): Movie {
  return {
    id: Number(row.id),
    title: String(row.title),
    originalTitle: nullableString(row.original_title),
    releaseYear: nullableNumber(row.release_year),
    overview: nullableString(row.overview),
    posterPath: nullableString(row.poster_path),
    backdropPath: nullableString(row.backdrop_path),
    runtimeMinutes: nullableNumber(row.runtime_minutes),
    rating: nullableNumber(row.rating),
    favorite: bool(row.favorite),
    addedAt: String(row.added_at),
    updatedAt: String(row.updated_at)
  };
}

export function mapShow(row: Row): TvShow {
  return {
    id: Number(row.id),
    title: String(row.title),
    originalTitle: nullableString(row.original_title),
    firstAirYear: nullableNumber(row.first_air_year),
    overview: nullableString(row.overview),
    posterPath: nullableString(row.poster_path),
    backdropPath: nullableString(row.backdrop_path),
    rating: nullableNumber(row.rating),
    favorite: bool(row.favorite),
    addedAt: String(row.added_at),
    updatedAt: String(row.updated_at)
  };
}

export function mapEpisode(row: Row): Episode {
  return {
    id: Number(row.id),
    showId: Number(row.show_id),
    seasonNumber: Number(row.season_number),
    episodeNumber: Number(row.episode_number),
    title: nullableString(row.title),
    overview: nullableString(row.overview),
    runtimeMinutes: nullableNumber(row.runtime_minutes),
    airDate: nullableString(row.air_date),
    stillPath: nullableString(row.still_path)
  };
}

export function mapMediaFile(row: Row): MediaFile {
  return {
    id: Number(row.id),
    libraryFolderId: Number(row.library_folder_id),
    mediaKind: row.media_kind as MediaFile['mediaKind'],
    absolutePath: String(row.absolute_path),
    relativePath: String(row.relative_path),
    fileName: String(row.file_name),
    extension: String(row.extension),
    fileSize: Number(row.file_size),
    modifiedTime: String(row.modified_time),
    createdTime: String(row.created_time),
    durationSeconds: nullableNumber(row.duration_seconds),
    resolution: nullableString(row.resolution),
    videoCodec: nullableString(row.video_codec),
    audioTracks: nullableString(row.audio_tracks),
    subtitleTracks: nullableString(row.subtitle_tracks),
    matchedMovieId: nullableNumber(row.matched_movie_id),
    matchedShowId: nullableNumber(row.matched_show_id),
    matchedEpisodeId: nullableNumber(row.matched_episode_id),
    matchConfidence: Number(row.match_confidence),
    matchStatus: row.match_status as MediaFile['matchStatus']
  };
}

export function defaultSettings(deviceId: string): AppSettings {
  return {
    metadataProvider: 'local',
    tmdbApiKey: '',
    tmdbLanguage: 'en-US',
    autoScan: false,
    watchFolders: false,
    defaultSyncIncludesFiles: false,
    defaultScanMode: 'mixed',
    defaultMatcherStrategy: 'auto',
    extractFileMetadata: true,
    deviceId
  };
}
