'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { History, X, Clock } from 'lucide-react';
import { AnimeItem } from '@/lib/mockData';
import { SearchResultCard } from './SearchResultCard';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

interface SearchDropdownProps {
  isOpen: boolean;
  query: string;
  results: AnimeItem[];
  isLoading: boolean;
  selectedIndex: number;
  recentSearches: string[];
  onSelectResult: (anime: AnimeItem) => void;
  onSelectRecentSearch: (query: string) => void;
  onRemoveRecentSearch: (query: string) => void;
  onClearRecentSearches: () => void;
  onClose: () => void;
  onSetSelectedIndex: (index: number | ((prev: number) => number)) => void;
}

export function SearchDropdown({
  isOpen,
  query,
  results,
  isLoading,
  selectedIndex,
  recentSearches,
  onSelectResult,
  onSelectRecentSearch,
  onRemoveRecentSearch,
  onClearRecentSearches,
  onClose,
  onSetSelectedIndex,
}: SearchDropdownProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (results.length === 0) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        onSetSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        onSetSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (event.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          event.preventDefault();
          const selectedAnime = results[selectedIndex];
          onSelectResult(selectedAnime);
          router.push(`/anime/${selectedAnime.id}`);
          onClose();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, onSelectResult, onSetSelectedIndex, router]);

  if (!isOpen) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-1 bg-[#181a20] border border-[#262a34] shadow-2xl z-50 max-h-[420px] overflow-y-auto rounded-2xs text-xs"
    >
      {/* 1. Loading Skeleton State */}
      {isLoading && (
        <div className="p-3 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <LoadingSkeleton variant="rectangular" className="w-10 h-14 bg-[#242834]" />
              <div className="space-y-1 flex-1">
                <LoadingSkeleton variant="text" className="w-3/4 bg-[#242834]" />
                <LoadingSkeleton variant="text" className="w-1/2 bg-[#242834]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Active Search Results */}
      {!isLoading && hasQuery && results.length > 0 && (
        <div className="divide-y divide-[#242832]">
          <div className="px-3 py-1.5 bg-[#12141a] border-b border-[#242832] text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Anime Title Results ({results.length})</span>
            <span className="text-[9px] text-gray-500 font-normal">Use ↑↓ to navigate</span>
          </div>
          {results.map((anime, index) => (
            <SearchResultCard
              key={anime.id}
              anime={anime}
              isSelected={index === selectedIndex}
              onSelect={() => {
                onSelectResult(anime);
                onClose();
              }}
            />
          ))}
        </div>
      )}

      {/* 3. Empty Search Results State */}
      {!isLoading && hasQuery && results.length === 0 && (
        <div className="p-6 text-center text-gray-400 space-y-1">
          <p className="font-semibold text-white">No anime found.</p>
          <p className="text-[11px] text-gray-500">
            Try searching for another title (e.g. &quot;Oshi no Ko&quot; or &quot;Wistoria&quot;)
          </p>
        </div>
      )}

      {/* 4. Recent Searches List (shown when query is empty) */}
      {!hasQuery && recentSearches.length > 0 && (
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-[#262a34]">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>Recent Searches</span>
            </div>
            <button
              onClick={onClearRecentSearches}
              className="text-[10px] text-gray-400 hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-1">
            {recentSearches.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-2xs hover:bg-[#242834] text-gray-300 transition-colors group cursor-pointer"
                onClick={() => onSelectRecentSearch(item)}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-white">{item}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveRecentSearch(item);
                  }}
                  className="text-gray-500 hover:text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove search entry"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Default Hint (when query is empty and no recent searches exist) */}
      {!hasQuery && recentSearches.length === 0 && (
        <div className="p-4 text-center text-gray-400 text-xs">
          Type an anime title to search instantly...
        </div>
      )}
    </div>
  );
}
