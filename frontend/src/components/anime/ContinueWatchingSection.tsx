'use client';

import React from 'react';
import { History } from 'lucide-react';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { AnimeSection } from './AnimeSection';

interface ContinueWatchingSectionProps {
  excludeAnimeId?: string;
}

export function ContinueWatchingSection({ excludeAnimeId }: ContinueWatchingSectionProps) {
  const { history } = useWatchHistory();

  const items = history
    .filter((entry) => entry.anime && (!excludeAnimeId || entry.anime.id !== excludeAnimeId))
    .map((entry) => ({
      ...entry.anime,
      currentEpisode: entry.episodeNumber,
      progressPercent: entry.progressPercent,
    }));

  // NOTE: hides itself entirely for new users / no local history, rather
  // than showing an empty "Continue Watching" section.
  if (items.length === 0) return null;

  return (
    <AnimeSection
      title="Continue Watching"
      items={items}
      icon={<History className="w-5 h-5 text-[#22c55e]" />}
      showProgress
      aspect="landscape"
    />
  );
}
