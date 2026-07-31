'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { SearchDropdown } from './SearchDropdown';

export function SearchInput() {
  const [isOpen, setIsOpen] = useState(false);
  const { query, setQuery, results, isLoading, selectedIndex, setSelectedIndex } = useSearch(120);
  const { recentSearches, addRecentSearch, clearRecentSearches, removeRecentSearch } =
    useRecentSearches();

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleClearInput = () => {
    setQuery('');
  };

  return (
    <div className="relative w-full">
      {/* Search Input Box matching YugenAnime Header Layout */}
      <div className="relative flex items-center w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleFocus}
          placeholder="Search anime..."
          className="w-full h-8 bg-[#0a0a0a] border border-[#2a2a2a] text-white text-xs pl-3 pr-8 focus:outline-none focus:border-[#22c55e] transition-colors"
        />

        {/* Clear Button or Search Button */}
        {query ? (
          <button
            onClick={handleClearInput}
            className="absolute right-9 text-gray-400 hover:text-white p-1"
          >
            <X className="w-3 h-3" />
          </button>
        ) : null}

        <button
          onClick={() => {
            if (query.trim()) addRecentSearch(query.trim());
          }}
          className="h-8 px-3.5 bg-[#1f1f1f] border border-l-0 border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#262626] transition-colors flex items-center justify-center flex-shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Live Search Dropdown */}
      <SearchDropdown
        isOpen={isOpen}
        query={query}
        results={results}
        isLoading={isLoading}
        selectedIndex={selectedIndex}
        recentSearches={recentSearches}
        onSelectResult={(anime) => {
          addRecentSearch(anime.title);
        }}
        onSelectRecentSearch={(recentQuery) => {
          setQuery(recentQuery);
        }}
        onRemoveRecentSearch={removeRecentSearch}
        onClearRecentSearches={clearRecentSearches}
        onClose={() => setIsOpen(false)}
        onSetSelectedIndex={setSelectedIndex}
      />
    </div>
  );
}
