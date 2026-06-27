import { memo, useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Film, Tv, HardDrive, Search, Check, Clock, EyeOff } from 'lucide-react';
import type { MediaFile, MovieMetadataSearchResult, TvMetadataSearchResult } from '@shared/ipc';

type MetadataResult = MovieMetadataSearchResult | TvMetadataSearchResult;

interface UnrecognizedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  unmatchedFiles: MediaFile[];
  busy: boolean;
  onSearchMetadata: (file: MediaFile, query: string, year?: number) => Promise<MetadataResult[]>;
  onApplyMetadata: (file: MediaFile, result: MetadataResult) => Promise<void>;
  onMarkAsIgnored: (fileId: number) => Promise<void>;
  onUnmarkAsIgnored: (fileId: number) => Promise<void>;
}

const formatFileSize = (bytes: number) => `${(bytes / 1024 ** 3).toFixed(2)} GB`;

export const UnrecognizedDrawer = memo(function UnrecognizedDrawer({
  isOpen,
  onClose,
  unmatchedFiles,
  busy,
  onSearchMetadata,
  onApplyMetadata,
  onMarkAsIgnored,
  onUnmarkAsIgnored
}: UnrecognizedDrawerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [extractedYear, setExtractedYear] = useState<number | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<MetadataResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const currentFile = unmatchedFiles[currentIndex];

  useEffect(() => {
    if (currentIndex >= unmatchedFiles.length && unmatchedFiles.length > 0) {
      setCurrentIndex(unmatchedFiles.length - 1);
    } else if (unmatchedFiles.length === 0) {
      setCurrentIndex(0);
    }
  }, [unmatchedFiles.length]);

  const handleAutoSearch = useCallback(async (file: MediaFile, query: string, year?: number) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const results = await onSearchMetadata(file, query, year);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [onSearchMetadata]);

  useEffect(() => {
    if (currentFile && isOpen) {
      const yearMatch = currentFile.fileName.match(/\(?\b(19\d{2}|20\d{2})\b\)?/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;
      let cleanTitle = currentFile.fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[._]/g, ' ')
        .replace(/\(?\d{4}\)?/g, '')
        .replace(/\(\s*\)/g, '')
        .replace(/\b(720p|1080p|2160p|4K|BluRay|WEB|DL|HEVC|x264|x265)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (year) cleanTitle = `${cleanTitle} ${year}`;
      setSearchQuery(cleanTitle);
      setExtractedYear(year);
      handleAutoSearch(currentFile, cleanTitle, year);
    }
  }, [currentIndex, currentFile, isOpen, handleAutoSearch]);

  const handleManualSearch = useCallback(async () => {
    if (!currentFile || !searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await onSearchMetadata(currentFile, searchQuery, extractedYear);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [currentFile, searchQuery, extractedYear, onSearchMetadata]);

  const handleApplyMatch = useCallback(async (result: MetadataResult) => {
    if (!currentFile) return;
    try {
      await onApplyMetadata(currentFile, result);
      if (unmatchedFiles.length === 1) onClose();
    } catch {
      // silently ignore
    }
  }, [currentFile, onApplyMetadata, unmatchedFiles.length, onClose]);

  const handleIgnore = useCallback(async () => {
    if (!currentFile) return;
    try {
      if (currentFile.matchStatus === 'ignored') {
        await onUnmarkAsIgnored(currentFile.id);
      } else {
        await onMarkAsIgnored(currentFile.id);
      }
      if (unmatchedFiles.length === 1) onClose();
    } catch {
      // silently ignore
    }
  }, [currentFile, onUnmarkAsIgnored, onMarkAsIgnored, unmatchedFiles.length, onClose]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < unmatchedFiles.length - 1) setCurrentIndex(currentIndex + 1);
  }, [currentIndex, unmatchedFiles.length]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleManualSearch();
  }, [handleManualSearch]);

  if (!isOpen) return null;

  if (unmatchedFiles.length === 0) {
    return (
      <div className="unrecognized-drawer open">
        <div className="unrecognized-drawer-header">
          <h2>Unrecognized Files</h2>
          <button className="close-button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="unrecognized-drawer-empty">
          <Check size={48} />
          <h3>All Clear!</h3>
          <p>All media files have been recognized.</p>
        </div>
      </div>
    );
  }

  if (!currentFile) return null;

  return (
    <div className="unrecognized-drawer open">
      <div className="unrecognized-drawer-header">
        <h2>Unrecognized Files</h2>
        <div className="file-counter">{currentIndex + 1} of {unmatchedFiles.length}</div>
        <button className="close-button" onClick={onClose}><X size={20} /></button>
      </div>

      <div className="unrecognized-drawer-content">
        <div className="file-info-card">
          <div className="file-info-header">
            {currentFile.mediaKind === 'movie' ? <Film size={24} /> : <Tv size={24} />}
            <div className="file-info-type">
              {currentFile.mediaKind === 'movie' ? 'Movie' : 'TV Show'}
              {currentFile.matchStatus === 'ignored' && <span className="ignored-badge">Ignored</span>}
            </div>
          </div>
          <div className="file-info-details">
            <div className="file-info-row"><label>Filename:</label><span>{currentFile.fileName}</span></div>
            <div className="file-info-row"><label>Path:</label><span className="file-path">{currentFile.relativePath}</span></div>
            <div className="file-info-row"><label>Size:</label><span>{formatFileSize(currentFile.fileSize)}</span></div>
          </div>
        </div>

        <div className="search-section">
          <label>Search for match:</label>
          <div className="search-input-group">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="Enter title to search..."
              disabled={isSearching}
            />
            <button onClick={handleManualSearch} disabled={isSearching || !searchQuery.trim()} className="search-button">
              <Search size={18} />
              Search
            </button>
          </div>
        </div>

        <div className="results-section">
          <h3>Suggested Matches</h3>
          {isSearching ? (
            <div className="results-loading">Searching...</div>
          ) : searchResults.length > 0 ? (
            <div className="results-list">
              {searchResults.map((result, index) => (
                <button key={index} className="result-item" onClick={() => handleApplyMatch(result)} disabled={busy}>
                  {result.posterUrl ? (
                    <img src={result.posterUrl} alt={result.title} className="result-poster" />
                  ) : (
                    <div className="result-poster-placeholder">
                      {currentFile.mediaKind === 'movie' ? <Film size={24} /> : <Tv size={24} />}
                    </div>
                  )}
                  <div className="result-info">
                    <div className="result-title">{result.title}</div>
                    <div className="result-meta">
                      {'releaseYear' in result ? result.releaseYear : 'firstAirYear' in result ? result.firstAirYear : 'N/A'}
                      {result.rating && ` • ${result.rating.toFixed(1)}★`}
                    </div>
                    {result.overview && <div className="result-overview">{result.overview}</div>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="results-empty">No matches found. Try adjusting your search query.</div>
          )}
        </div>
      </div>

      <div className="unrecognized-drawer-footer">
        <button onClick={handleIgnore} className="action-button ignore-button" disabled={busy}>
          <EyeOff size={18} />
          {currentFile.matchStatus === 'ignored' ? 'Un-ignore' : 'Ignore'}
        </button>
        <div className="navigation-buttons">
          <button onClick={handlePrevious} disabled={currentIndex === 0} className="nav-button">
            <ChevronLeft size={18} />
            Previous
          </button>
          <button onClick={handleNext} disabled={currentIndex >= unmatchedFiles.length - 1} className="nav-button">
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
});
