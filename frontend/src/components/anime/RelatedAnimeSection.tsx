'use client';

import React, { useEffect, useState } from 'react';
import { AniKotoClient, mapAniKotoItem } from '@/lib/api/anikoto';
import { AnimeItem } from '@/lib/mockData';
import { AnimeSection } from './AnimeSection';

interface RelatedAnimeSectionProps {
  animeId: string;
  genres?: string[];
  title: string;
  icon?: React.ReactNode;
  // NOTE: picks a different genre than the default (index 0) so a page
  // rendering both "Related" and "You Might Also Like" doesn't show
  // the exact same list twice.
  shuffle?: boolean;
}

export function RelatedAnimeSection({ animeId, genres, title, icon, shuffle }: RelatedAnimeSectionProps) {
  const [items, setItems] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const genresKey = genres?.join(',') || '';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!genres || genres.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const genreIndex = shuffle ? Math.min(1, genres.length - 1) : 0;
        const genreSlug = genres[genreIndex].toLowerCase().replace(/\s+/g, '-');
        const data = await AniKotoClient.getFilter({ genre: genreSlug, page: 1 });
        const arr = data?.data || data?.results || [];
        const mapped = arr
          .map((item: any) => mapAniKotoItem(item))
          .filter((a: AnimeItem) => a.id !== animeId)
          .slice(0, 12);
        if (!cancelled) setItems(mapped);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeId, genresKey, shuffle]);

  if (!loading && items.length === 0) return null;

  return (
    <AnimeSection
      title={title}
      items={items}
      icon={icon}
      aspect="portrait"
    />
  );
}
