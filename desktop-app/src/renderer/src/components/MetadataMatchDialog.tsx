import { memo } from 'react';
import type { Movie, MovieMetadataSearchResult } from '@shared/ipc';

export interface MetadataMatchPrompt {
  movie: Movie;
  results: MovieMetadataSearchResult[];
}

export const MetadataMatchDialog = memo(function MetadataMatchDialog({
  prompt,
  busy,
  onApply,
  onSkip
}: {
  prompt: MetadataMatchPrompt | null;
  busy: boolean;
  onApply(result: MovieMetadataSearchResult): void;
  onSkip(): void;
}) {
  if (!prompt) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="metadata-match-dialog" role="dialog" aria-modal="true" aria-labelledby="metadata-match-title">
        <header>
          <div>
            <span>TMDB match review</span>
            <h2 id="metadata-match-title">{prompt.movie.title}</h2>
          </div>
          <button disabled={busy} onClick={onSkip}>Skip</button>
        </header>

        <div className="metadata-match-list">
          {prompt.results.map((result) => (
            <button key={`${result.provider}-${result.providerId}`} disabled={busy} onClick={() => onApply(result)}>
              {result.posterUrl ? <img src={result.posterUrl} alt="" /> : <div className="metadata-poster-placeholder" />}
              <span>
                <strong>{result.title}</strong>
                <small>{[result.year ?? 'Unknown year', result.rating ? `${result.rating.toFixed(1)} rating` : null].filter(Boolean).join(' / ')}</small>
                <em>{result.overview ?? 'No overview available.'}</em>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
});
