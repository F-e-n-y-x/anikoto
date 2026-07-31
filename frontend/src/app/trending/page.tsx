'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Loader2, LayoutGrid, List } from 'lucide-react';
import { AnimeItem } from '@/lib/mockData';
import { AniKotoClient, mapAniKotoItem } from '@/lib/api/anikoto';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { EmptyState } from '@/components/ui/EmptyState';

export default function TrendingPage() {
  const [items, setItems] = useState<AnimeItem[]>([]);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'YUGENANIME - Trending';
  }, []);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // NOTE: /api/trending has no page param — it's a fixed
        // homepage-derived list, so there's nothing to paginate.
        const data = await AniKotoClient.getTrending();
        const formattedResults = (data || []).map((item: any) =>
          mapAniKotoItem(item)
        );
        setItems(formattedResults);
      } catch (error) {
        console.error("Error loading trending anime:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-[#22c55e]" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Trending Anime
          </h1>
        </div>

        {/* View Layout Toggle & Item Count */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400 font-medium">
            ({items.length} titles)
          </span>

          <div className="flex items-center bg-[#181818] border border-[#262626] p-1 rounded-2xs">
            <button
              onClick={() => setActiveView('grid')}
              className={`p-1.5 rounded-2xs transition-colors ${
                activeView === 'grid'
                  ? 'bg-[#22c55e] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`p-1.5 rounded-2xs transition-colors ${
                activeView === 'list'
                  ? 'bg-[#22c55e] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-[#22c55e] mr-2" />
          <span>Loading Trending Titles...</span>
        </div>
      ) : items.length > 0 ? (
        <div
          className={`grid gap-4 ${
            activeView === 'grid'
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
          }`}
        >
          {items.map((anime) => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              aspect={activeView === 'grid' ? 'portrait' : 'landscape'}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Trending Anime Found"
          description="Could not load trending titles at the moment."
        />
      )}
    </div>
  );
}
