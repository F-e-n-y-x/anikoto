'use client';

import React, { useState, useEffect } from 'react';
import { Compass, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AnimeItem } from '@/lib/mockData';
import { AniKotoClient, mapAniKotoItem } from '@/lib/api/anikoto';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { AnimeFilterBar } from '@/components/anime/AnimeFilterBar';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DiscoverPage() {
  const [items, setItems] = useState<AnimeItem[]>([]);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'YUGENANIME - Discover';
  }, []);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await AniKotoClient.getFilter({ page: currentPage });

        // Map AniKoto items to AnimeItem
        const arrayData = data?.data || data?.results || data || [];
        const formattedResults = arrayData.map((item: any) =>
          mapAniKotoItem(item)
        );

        setItems(formattedResults);
        setTotalPages(data?.totalPages || data?.pagination?.totalPages || 1);
      } catch (error) {
        console.error("Error loading discover catalog:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [currentPage]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-[#22c55e]" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Discover Anime Catalog
          </h1>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          Filter and browse the complete anime collection
        </span>
      </div>

      {/* Main 2-Column Discover Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Left Column: Filter Sidebar */}
        <AnimeFilterBar
          layoutMode="sidebar"
          onViewChange={(view) => setActiveView(view)}
          totalResults={items.length}
        />

        {/* Right Column: Catalog Grid */}
        <div className="flex-1 space-y-6 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-[#22c55e] mr-2" />
              <span>Loading Discover Catalog...</span>
            </div>
          ) : items.length > 0 ? (
            <div
              className={`grid gap-4 ${
                activeView === 'grid'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'
                  : 'grid-cols-1 sm:grid-cols-2'
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
              title="No Anime Matches Found"
              description="Could not load the anime catalog."
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-[#262626] text-xs">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="p-1.5 bg-[#181818] border border-[#262626] text-gray-400 hover:text-white rounded-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 font-bold rounded-2xs border transition-colors ${
                    currentPage === page
                      ? 'bg-[#22c55e] text-black border-[#22c55e]'
                      : 'bg-[#181818] text-gray-300 border-[#262626] hover:text-white hover:border-gray-500'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="p-1.5 bg-[#181818] border border-[#262626] text-gray-400 hover:text-white rounded-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
