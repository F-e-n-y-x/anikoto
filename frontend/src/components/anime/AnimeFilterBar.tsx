'use client';

import React, { useState } from 'react';
import { LayoutGrid, List, SlidersHorizontal, Search } from 'lucide-react';

interface AnimeFilterBarProps {
  onSearchChange?: (q: string) => void;
  onGenreChange?: (genre: string) => void;
  onSortChange?: (sort: string) => void;
  onViewChange?: (view: 'grid' | 'list') => void;
  totalResults?: number;
  layoutMode?: 'horizontal' | 'sidebar';
}

export function AnimeFilterBar({
  onViewChange,
  totalResults = 24,
  layoutMode = 'horizontal',
}: AnimeFilterBarProps) {
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedStudio, setSelectedStudio] = useState('ALL');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedRating, setSelectedRating] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('POPULARITY_DESC');

  const handleViewToggle = (view: 'grid' | 'list') => {
    setActiveView(view);
    if (onViewChange) onViewChange(view);
  };

  const isSidebar = layoutMode === 'sidebar';

  return (
    <div
      className={`bg-[#181818] border border-[#262626] p-4 rounded-2xs space-y-4 ${
        isSidebar ? 'w-full lg:w-64 flex-shrink-0' : 'w-full'
      }`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#22c55e]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Discover Filters
          </span>
        </div>

        {!isSidebar && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 font-mono">
              ({totalResults} items)
            </span>
            <div className="flex items-center gap-1 bg-[#121212] p-1 border border-[#2a2a2a] rounded-2xs">
              <button
                onClick={() => handleViewToggle('grid')}
                className={`p-1 rounded-2xs transition-colors ${
                  activeView === 'grid'
                    ? 'bg-[#22c55e] text-black font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleViewToggle('list')}
                className={`p-1 rounded-2xs transition-colors ${
                  activeView === 'list'
                    ? 'bg-[#22c55e] text-black font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Input Placeholder */}
      <div className="relative flex items-center w-full">
        <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search catalog..."
          className="w-full h-8 bg-[#121212] border border-[#2a2a2a] text-white text-xs pl-8 pr-2.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
        />
      </div>

      {/* Filter Options Grid */}
      <div
        className={`grid gap-3 text-xs ${
          isSidebar
            ? 'grid-cols-1'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
        }`}
      >
        {/* Genre */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Genre</label>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full bg-[#121212] border border-[#2a2a2a] text-white text-xs px-2 py-1.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          >
            <option value="ALL">All Genres</option>
            <option value="Action">Action</option>
            <option value="Adventure">Adventure</option>
            <option value="Comedy">Comedy</option>
            <option value="Drama">Drama</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Slice of Life">Slice of Life</option>
          </select>
        </div>

        {/* Year */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full bg-[#121212] border border-[#2a2a2a] text-white text-xs px-2 py-1.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          >
            <option value="ALL">All Years</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </select>
        </div>

        {/* Season */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Season</label>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="w-full bg-[#121212] border border-[#2a2a2a] text-white text-xs px-2 py-1.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          >
            <option value="ALL">All Seasons</option>
            <option value="WINTER">Winter</option>
            <option value="SPRING">Spring</option>
            <option value="SUMMER">Summer</option>
            <option value="FALL">Fall</option>
          </select>
        </div>

        {/* Format */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Format</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full bg-[#121212] border border-[#2a2a2a] text-white text-xs px-2 py-1.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          >
            <option value="ALL">All Formats</option>
            <option value="TV">TV Series</option>
            <option value="MOVIE">Movie</option>
            <option value="OVA">OVA</option>
            <option value="SPECIAL">Special</option>
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-[#121212] border border-[#2a2a2a] text-white text-xs px-2 py-1.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          >
            <option value="ALL">All Status</option>
            <option value="RELEASING">Airing</option>
            <option value="FINISHED">Finished</option>
            <option value="UPCOMING">Upcoming</option>
          </select>
        </div>

        {/* Source */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Source</label>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full bg-[#121212] border border-[#2a2a2a] text-white text-xs px-2 py-1.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          >
            <option value="ALL">All Sources</option>
            <option value="MANGA">Manga</option>
            <option value="LIGHT_NOVEL">Light Novel</option>
            <option value="ORIGINAL">Original</option>
          </select>
        </div>

        {/* Studio */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Studio</label>
          <select
            value={selectedStudio}
            onChange={(e) => setSelectedStudio(e.target.value)}
            className="w-full bg-[#121212] border border-[#2a2a2a] text-white text-xs px-2 py-1.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          >
            <option value="ALL">All Studios</option>
            <option value="Doga Kobo">Doga Kobo</option>
            <option value="A-1 Pictures">A-1 Pictures</option>
            <option value="MAPPA">MAPPA</option>
            <option value="ufotable">ufotable</option>
          </select>
        </div>

        {/* Country */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Country</label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full bg-[#121212] border border-[#2a2a2a] text-white text-xs px-2 py-1.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          >
            <option value="ALL">All Countries</option>
            <option value="JP">Japan (Anime)</option>
            <option value="CN">China (Donghua)</option>
            <option value="KR">Korea</option>
          </select>
        </div>

        {/* Rating */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Rating Score</label>
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="w-full bg-[#121212] border border-[#2a2a2a] text-white text-xs px-2 py-1.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          >
            <option value="ALL">All Ratings</option>
            <option value="8.0">8.0+ Score</option>
            <option value="7.0">7.0+ Score</option>
            <option value="6.0">6.0+ Score</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Sort By</label>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="w-full bg-[#121212] border border-[#2a2a2a] text-white text-xs font-semibold px-2 py-1.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          >
            <option value="POPULARITY_DESC">Most Popular</option>
            <option value="SCORE_DESC">Highest Rated</option>
            <option value="FAVORITES_DESC">Most Favorited</option>
            <option value="UPDATED_AT_DESC">Recently Updated</option>
          </select>
        </div>
      </div>
    </div>
  );
}
