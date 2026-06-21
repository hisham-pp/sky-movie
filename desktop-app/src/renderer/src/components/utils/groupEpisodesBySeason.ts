import type { Episode } from '@shared/ipc';

export function groupEpisodesBySeason(episodes: Episode[]) {
  const seasonMap = new Map<number, Episode[]>();
  for (const episode of episodes) {
    const seasonEpisodes = seasonMap.get(episode.seasonNumber) ?? [];
    seasonEpisodes.push(episode);
    seasonMap.set(episode.seasonNumber, seasonEpisodes);
  }

  return [...seasonMap.entries()]
    .sort(([left], [right]) => left - right)
    .map(([seasonNumber, seasonEpisodes]) => ({
      seasonNumber,
      episodes: seasonEpisodes.sort((left, right) => left.episodeNumber - right.episodeNumber)
    }));
}
