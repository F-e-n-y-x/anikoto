'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Heart, Star, Film, Bookmark, BarChart2 } from 'lucide-react';
import { AnimeItem } from '@/lib/mockData';

interface AnimeDetailsHeaderProps {
  anime: AnimeItem;
}

export function AnimeDetailsHeader({ anime }: AnimeDetailsHeaderProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div className="bg-[#16181f] border border-[#262626] p-6 rounded-2xs flex flex-col md:flex-row gap-6 shadow-xl">
      {/* Left Column: Poster Image */}
      <div className="w-[180px] sm:w-[220px] aspect-[2/3] bg-[#121212] rounded-2xs overflow-hidden border border-[#2a2a2a] shadow-2xl flex-shrink-0 mx-auto md:mx-0 relative">
        {anime.poster ? (
          <Image
            src={anime.poster}
            alt={anime.title}
            fill
            priority
            className="object-cover"
          />
        ) : null}
      </div>

        {/* Info Column */}
        <div className="flex-1 space-y-4 text-left">
          {/* Titles */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#22c55e] text-black font-extrabold text-[10px] px-2 py-0.5 uppercase tracking-wider rounded-2xs">
                {anime.type || 'TV'}
              </span>
              {anime.status && (
                <span className="text-[#22c55e] text-xs font-bold uppercase">
                  • {anime.status}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {anime.title}
            </h1>
            {anime.romajiTitle && (
              <p className="text-xs sm:text-sm text-[#22c55e] font-semibold">
                {anime.romajiTitle}
              </p>
            )}
            {anime.nativeTitle && (
              <p className="text-xs text-gray-400 font-mono">
                {anime.nativeTitle}
              </p>
            )}
          </div>

          {/* 3. Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={`/watch/${anime.id}/1`}
              className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 fill-black" />
              Watch Episode 1
            </Link>

            {/* Favorite UI Toggle Placeholder */}
            <button
              onClick={() => setIsFavorite((prev) => !prev)}
              className={`p-2 border rounded-xs transition-colors ${
                isFavorite
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-[#141414] text-gray-300 border-[#2a2a2a] hover:text-white hover:border-[#22c55e]'
              }`}
              title={isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
            </button>

            {/* Bookmark UI Toggle Placeholder */}
            <button
              onClick={() => setIsBookmarked((prev) => !prev)}
              className={`p-2 border rounded-xs transition-colors ${
                isBookmarked
                  ? 'bg-[#22c55e] text-black border-[#22c55e]'
                  : 'bg-[#141414] text-gray-300 border-[#2a2a2a] hover:text-white hover:border-[#22c55e]'
              }`}
              title={isBookmarked ? 'In Watchlist' : 'Add to Watchlist'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-black' : ''}`} />
            </button>
          </div>

          {/* 4. Synopsis */}
          <div className="space-y-1 pt-1">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Synopsis
            </h4>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {anime.synopsis}
            </p>
          </div>

          {/* 5. Statistics & Metadata Grid */}
          <div className="space-y-2 pt-2 border-t border-[#262626]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#22c55e] uppercase">
              <BarChart2 className="w-4 h-4 text-[#22c55e]" />
              <span>Statistics & Information</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#121212] p-2.5 rounded-2xs border border-[#262626]">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">AniList Rating</span>
                <span className="text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {anime.rating || '8.9'} / 10
                </span>
              </div>
              <div className="bg-[#121212] p-2.5 rounded-2xs border border-[#262626]">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Studio</span>
                <span className="text-gray-200 font-semibold">{anime.studio || 'Doga Kobo'}</span>
              </div>
              <div className="bg-[#121212] p-2.5 rounded-2xs border border-[#262626]">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Season & Year</span>
                <span className="text-gray-200 font-semibold">
                  {anime.season || 'Summer'} {anime.year || 2024}
                </span>
              </div>
              <div className="bg-[#121212] p-2.5 rounded-2xs border border-[#262626]">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Episodes & Runtime</span>
                <span className="text-gray-200 font-semibold">
                  {anime.episodes || 12} Eps ({anime.duration || '24 min'})
                </span>
              </div>
            </div>
          </div>

          {/* Genres Tags */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {anime.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-[#121212] border border-[#2a2a2a] text-gray-300 text-[11px] font-semibold px-2 py-0.5 rounded-2xs"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
