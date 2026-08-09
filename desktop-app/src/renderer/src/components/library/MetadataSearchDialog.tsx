import { memo, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import type { MovieMetadataSearchResult, TvMetadataSearchResult } from '@shared/ipc';
import { Button } from '../common';

type MetadataResult = MovieMetadataSearchResult | TvMetadataSearchResult;

export const MetadataSearchDialog = memo(function MetadataSearchDialog({
  title,
  metadataQuery,
  metadataResults,
  busy,
  onMetadataQueryChange,
  onSearchMetadata,
  onApplyMetadata,
  onClose
}: {
  title: string;
  metadataQuery: string;
  metadataResults: MetadataResult[];
  busy: boolean;
  onMetadataQueryChange(value: string): void;
  onSearchMetadata(): void;
  onApplyMetadata(result: MetadataResult): void;
  onClose(): void;
}) {
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onMetadataQueryChange(e.target.value),
    [onMetadataQueryChange],
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !busy) {
        onSearchMetadata();
      }
    },
    [busy, onSearchMetadata],
  );

  const handleApply = useCallback(
    (result: MetadataResult) => {
      onApplyMetadata(result);
      onClose();
    },
    [onApplyMetadata, onClose],
  );

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="metadata-search-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Search Metadata: {title}</h3>
          <button className="dialog-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="dialog-body">
          <div className="metadata-search-input">
            <input
              value={metadataQuery}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Search TMDB metadata..."
              autoFocus
            />
            <Button
              variant="primary"
              size="medium"
              icon={<Search size={16} />}
              onClick={onSearchMetadata}
              disabled={busy}
            >
              Search
            </Button>
          </div>
          {metadataResults.length > 0 && (
            <div className="metadata-results">
              {metadataResults.map((result) => (
                <button
                  key={`${result.provider}-${result.providerId}`}
                  className="metadata-result-item"
                  disabled={busy}
                  onClick={() => handleApply(result)}
                >
                  {result.posterUrl ? (
                    <img src={result.posterUrl} alt="" />
                  ) : (
                    <div className="metadata-poster-placeholder" />
                  )}
                  <span>
                    <strong>{result.title}</strong>
                    <small>{result.year ?? 'Unknown year'}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
          {metadataResults.length === 0 && metadataQuery && !busy && (
            <div className="metadata-empty">
              <p>No results found. Try a different search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
