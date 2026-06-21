import { Star } from 'lucide-react';
import type { MovieMetadataSearchResult, TvMetadataSearchResult } from '@shared/ipc';

type MetadataResult = MovieMetadataSearchResult | TvMetadataSearchResult;

export function MetadataTools({
  label,
  overview,
  meta,
  metadataQuery,
  metadataResults,
  busy,
  onMetadataQueryChange,
  onSearchMetadata,
  onApplyMetadata
}: {
  label: string;
  overview: string | null;
  meta: Array<string | number | null>;
  metadataQuery: string;
  metadataResults: MetadataResult[];
  busy: boolean;
  onMetadataQueryChange(value: string): void;
  onSearchMetadata(): void;
  onApplyMetadata(result: MetadataResult): void;
}) {
  return (
    <section className="detail-card metadata-panel">
      <div>
        <strong>
          <Star size={15} />
          {label}
        </strong>
        <p>{overview ?? 'No overview stored yet.'}</p>
        <span>{meta.filter(Boolean).join(' / ')}</span>
      </div>
      <div className="metadata-search">
        <input
          value={metadataQuery}
          onChange={(event) => onMetadataQueryChange(event.target.value)}
          placeholder="Search TMDB metadata"
        />
        <button disabled={busy} onClick={onSearchMetadata}>
          Load
        </button>
      </div>
      <div className="metadata-results">
        {metadataResults.map((result) => (
          <button key={`${result.provider}-${result.providerId}`} disabled={busy} onClick={() => onApplyMetadata(result)}>
            {result.posterUrl ? <img src={result.posterUrl} alt="" /> : <div className="metadata-poster-placeholder" />}
            <span>
              <strong>{result.title}</strong>
              <small>{result.year ?? 'Unknown year'}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
