'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { History, Trash2, Search, Play, Clock, Film, BarChart2, CheckCircle2 } from 'lucide-react';
import { useWatchHistory, WatchHistoryEntry } from '@/hooks/useWatchHistory';
import { ClearHistoryDialog, RemoveItemDialog } from '@/components/history/HistoryDialogs';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WatchHistoryPage() {
  const { history, removeEntry, clearHistory } = useWatchHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('RECENT');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<WatchHistoryEntry | null>(null);

  React.useEffect(() => {
    document.title = 'YUGENANIME - History';
  }, []);

  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.anime.title.toLowerCase().includes(q) ||
      item.anime.romajiTitle?.toLowerCase().includes(q) ||
      item.episodeTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-[#22c55e]" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Watch History
          </h1>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="text-xs font-semibold text-rose-400 hover:text-white bg-[#181818] border border-[#262626] hover:border-rose-600 px-3 py-1.5 rounded-2xs transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* 2. Placeholder Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#181818] border border-[#262626] p-3 rounded-2xs flex items-center gap-3">
          <div className="p-2 bg-[#22c55e]/10 text-[#22c55e] rounded-2xs">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Anime Watched</span>
            <span className="text-sm font-extrabold text-white">{history.length || 14}</span>
          </div>
        </div>

        <div className="bg-[#181818] border border-[#262626] p-3 rounded-2xs flex items-center gap-3">
          <div className="p-2 bg-[#22c55e]/10 text-[#22c55e] rounded-2xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Episodes Watched</span>
            <span className="text-sm font-extrabold text-white">42</span>
          </div>
        </div>

        <div className="bg-[#181818] border border-[#262626] p-3 rounded-2xs flex items-center gap-3">
          <div className="p-2 bg-[#22c55e]/10 text-[#22c55e] rounded-2xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Hours Watched</span>
            <span className="text-sm font-extrabold text-white">16.8 hrs</span>
          </div>
        </div>

        <div className="bg-[#181818] border border-[#262626] p-3 rounded-2xs flex items-center gap-3">
          <div className="p-2 bg-[#22c55e]/10 text-[#22c55e] rounded-2xs">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Continue Watching</span>
            <span className="text-sm font-extrabold text-white">{history.length}</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-[#181818] border border-[#262626] p-4 rounded-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex items-center w-full sm:w-72">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search watch history..."
            className="w-full h-8 bg-[#121212] border border-[#2a2a2a] text-white text-xs pl-8 pr-2.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase">Sort:</span>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="h-8 bg-[#121212] border border-[#2a2a2a] text-white text-xs font-semibold px-2.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          >
            <option value="RECENT">Last Watched</option>
            <option value="TITLE">Anime Title</option>
            <option value="PROGRESS">Watch Progress</option>
          </select>
        </div>
      </div>

      {/* 4. Watch History Items Grid */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            History Feed ({filteredHistory.length} items)
          </h3>

          <div className="space-y-2">
            {filteredHistory.map((item) => (
              <div
                key={`${item.anime.id}-${item.episodeNumber}`}
                className="bg-[#181818] border border-[#262626] hover:border-[#2a2a2a] p-3 rounded-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors group"
              >
                {/* Left: Thumbnail & Episode Details */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail */}
                  <div className="relative w-24 aspect-[16/9] bg-[#121212] rounded-2xs overflow-hidden flex-shrink-0 border border-[#262626]">
                    {item.anime.poster ? (
                      <Image
                        src={item.anime.poster}
                        alt={item.anime.title}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                    <div className="absolute bottom-0.5 right-0.5 bg-black/90 text-[8px] font-bold text-white px-1 py-0.2 rounded-2xs">
                      {item.duration || '24:00'}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[#22c55e] transition-colors">
                      {item.anime.title}
                    </h4>
                    <p className="text-[11px] font-medium text-[#22c55e]">
                      EP {item.episodeNumber} : {item.episodeTitle}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span>{item.watchedAt}</span>
                      <span>•</span>
                      <span>{item.remainingTime || '7 mins left'}</span>
                      <span>•</span>
                      <span className="text-[#22c55e] font-bold">{item.progressPercent}% completed</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-48 h-1 bg-[#121212] rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-[#22c55e]"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    href={`/watch/${item.anime.id}/${item.episodeNumber}`}
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs px-3 py-1.5 rounded-2xs flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Resume</span>
                  </Link>

                  <button
                    onClick={() => setItemToRemove(item)}
                    className="p-1.5 bg-[#121212] border border-[#2a2a2a] text-gray-400 hover:text-rose-500 hover:border-rose-600 rounded-2xs transition-colors"
                    title="Remove from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Watch History Found"
          description="You haven't watched any anime episodes yet, or your search query returned no entries."
        />
      )}

      {/* Confirmation Dialogs */}
      <ClearHistoryDialog
        isOpen={isClearModalOpen}
        onConfirm={clearHistory}
        onClose={() => setIsClearModalOpen(false)}
      />

      <RemoveItemDialog
        isOpen={!!itemToRemove}
        title={itemToRemove?.anime.title}
        onConfirm={() => {
          if (itemToRemove) {
            removeEntry(itemToRemove.anime.id, itemToRemove.episodeNumber);
            setItemToRemove(null);
          }
        }}
        onClose={() => setItemToRemove(null)}
      />
    </div>
  );
}
