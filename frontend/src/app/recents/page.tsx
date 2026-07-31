'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AnimeItem } from '@/lib/mockData';
import { AniKotoClient, mapAniKotoItem } from '@/lib/api/anikoto';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePreferences } from '@/context/PreferenceContext';

export default function RecentsPage() {
  const [items, setItems] = useState<AnimeItem[]>([]);
  const { audioMode: activeTab, setAudioMode: setActiveTab } = usePreferences();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'YUGENANIME - Recently Updated';
  }, []);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await AniKotoClient.getLatestUpdated(currentPage);
        const arrayData = data?.data || data?.results || data || [];
        const formattedResults = arrayData.map((item: any) =>
          mapAniKotoItem(item)
        );
        setItems(formattedResults);
        setTotalPages(data?.totalPages || data?.pagination?.totalPages || 1);
      } catch (error) {
        console.error("Error loading recents:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [currentPage]);

  const filteredItems = items.filter((item) => {
    if (activeTab === 'SUB' && item.subDub === 'DUB') return false;
    if (activeTab === 'DUB' && item.subDub !== 'DUB') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.romajiTitle?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-[#22c55e]" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Recently Updated Episodes
          </h1>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          Fresh anime releases feed
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#181818] border border-[#262626] p-4 rounded-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Audio Tabs */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
            Audio:
          </span>
          {(['SUB', 'DUB'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-bold rounded-2xs uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? 'bg-[#22c55e] text-black'
                  : 'bg-[#121212] text-gray-400 border border-[#2a2a2a] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center w-full sm:w-56">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recents..."
              className="w-full h-8 bg-[#121212] border border-[#2a2a2a] text-white text-xs pl-8 pr-2.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
            />
          </div>

          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="h-8 bg-[#121212] border border-[#2a2a2a] text-white text-xs font-semibold px-2.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          >
            <option value="NEWEST">Newest Release</option>
            <option value="MOST_VIEWED">Most Viewed</option>
            <option value="RATING">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-[#22c55e] mr-2" />
          <span>Loading Recent Episodes...</span>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((anime) => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              aspect="landscape"
              variant="feed"
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Recent Episodes Found"
          description="Could not load recently updated episodes."
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

          {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map((page) => (
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
  );
}
