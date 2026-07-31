'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimeItem } from '@/lib/mockData';
import { AniKotoClient, mapAniKotoItem } from '@/lib/api/anikoto';

export function useSearch(debounceMs = 150) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchCountRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    const currentSearchId = ++searchCountRef.current;

    const timer = setTimeout(async () => {
      try {
        const suggestResults = await AniKotoClient.searchSuggest(trimmed);
        if (currentSearchId === searchCountRef.current) {
          // Clean the slug from suggestions to extract the anime ID correctly.
          // AniKoto might return "slug/ep-1". We only want the slug.
          const formattedResults = (suggestResults || []).map((item: any) => {
            const cleanSlug = item.slug ? item.slug.split('/')[0] : '';
            return mapAniKotoItem({ ...item, slug: cleanSlug });
          });
          
          setResults(formattedResults);
          setSelectedIndex(-1);
          setIsLoading(false);
        }
      } catch {
        if (currentSearchId === searchCountRef.current) {
          setResults([]);
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    selectedIndex,
    setSelectedIndex,
  };
}
