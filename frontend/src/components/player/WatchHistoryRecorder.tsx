'use client';

import { useEffect, useRef } from 'react';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { AnimeItem } from '@/lib/mockData';

interface WatchHistoryRecorderProps {
  anime: AnimeItem;
  episodeNumber: number;
  episodeTitle: string;
  durationMinutes: number;
}

const PROGRESS_UPDATE_INTERVAL_MS = 15000;
const DEFAULT_DURATION_MINUTES = 24;

// NOTE: Playback happens inside a cross-origin iframe embed, so real
// player progress can't be observed from here — this records a
// time-on-page estimate instead, capped short of 100% so it never
// falsely claims an episode was finished.
export function WatchHistoryRecorder({
  anime,
  episodeNumber,
  episodeTitle,
  durationMinutes,
}: WatchHistoryRecorderProps) {
  const { upsertEntry } = useWatchHistory();
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const totalMinutes = durationMinutes > 0 ? durationMinutes : DEFAULT_DURATION_MINUTES;

    const record = () => {
      const elapsedMinutes = (Date.now() - startRef.current) / 60000;
      const progressPercent = Math.min(95, Math.round((elapsedMinutes / totalMinutes) * 100));
      const remainingMinutes = Math.max(0, Math.round(totalMinutes - elapsedMinutes));

      upsertEntry({
        anime: { ...anime, currentEpisode: episodeNumber },
        episodeNumber,
        episodeTitle,
        watchedAt: new Date().toISOString(),
        progressPercent,
        remainingTime: `${remainingMinutes}m left`,
        duration: `${totalMinutes}m`,
      });
    };

    record();
    const interval = setInterval(record, PROGRESS_UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anime.id, episodeNumber]);

  return null;
}
