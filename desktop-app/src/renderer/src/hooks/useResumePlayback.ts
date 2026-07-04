import * as queries from '@renderer/queries';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryControllerContext } from './LibraryControllerContext';

export interface ResumeTarget {
  mediaFileId: number;
  matchedMovieId: number | null;
  matchedShowId: number | null;
}

/**
 * Resume playback of a media file from anywhere in the app.
 * Navigates to the owning movie/show detail page (where the player panel
 * lives) and plays the exact file, instead of starting invisible playback.
 */
export function useResumePlayback() {
  const library = useLibraryControllerContext();
  const navigate = useNavigate();

  return useCallback(
    async (target: ResumeTarget) => {
      if (target.matchedMovieId != null) {
        const movie =
          library.movies.find((m) => m.id === target.matchedMovieId) ??
          (await queries.getMovieById(target.matchedMovieId)).item;
        if (movie) {
          await library.selectMovie(movie, target.mediaFileId);
          navigate(`/movies/${movie.id}`);
          return;
        }
      }

      if (target.matchedShowId != null) {
        const show =
          library.shows.find((s) => s.id === target.matchedShowId) ??
          (await queries.getShowById(target.matchedShowId)).item;
        if (show) {
          await library.selectShow(show, target.mediaFileId);
          navigate(`/shows/${show.id}`);
          return;
        }
      }

      // Unmatched file — there is no detail page to open, play in place.
      await library.playById(target.mediaFileId);
    },
    [library, navigate],
  );
}
