'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimeItem } from '@/lib/mockData';

const STORAGE_KEY = 'yugen_watch_history';
const MAX_HISTORY_ENTRIES = 30;

export interface WatchHistoryEntry {
  anime: AnimeItem;
  episodeNumber: number;
  episodeTitle: string;
  watchedAt: string;
  progressPercent: number;
  remainingTime: string;
  duration: string;
}

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryEntry[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // Fallback
    }
  }, []);

  // Add or update the entry for an anime — an anime only ever has ONE
  // history entry (the most recently watched episode), moved to the front.
  const upsertEntry = useCallback((entry: WatchHistoryEntry) => {
    setHistory((prev) => {
      const withoutExisting = prev.filter((item) => item.anime?.id !== entry.anime?.id);
      const next = [entry, ...withoutExisting].slice(0, MAX_HISTORY_ENTRIES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Fallback
      }
      return next;
    });
  }, []);

  // Remove single entry
  const removeEntry = useCallback((animeId: string, episodeNumber: number) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (item) => !(item.anime && item.anime.id === animeId && item.episodeNumber === episodeNumber)
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch {
        // Fallback
      }
      return filtered;
    });
  }, []);

  // Clear all history entries
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Fallback
    }
  }, []);

  return {
    history,
    upsertEntry,
    removeEntry,
    clearHistory,
  };
}
