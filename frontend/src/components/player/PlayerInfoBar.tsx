'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Plus, ArrowLeft, Volume2 } from 'lucide-react';
import { AnimeItem } from '@/lib/mockData';
import { usePreferences } from '@/context/PreferenceContext';

interface PlayerInfoBarProps {
  anime: AnimeItem;
  currentEpNumber: number;
}

export function PlayerInfoBar({ anime, currentEpNumber }: PlayerInfoBarProps) {
  const [autoNext, setAutoNext] = useState(true);
  const { audioMode: selectedAudio, setAudioMode: setSelectedAudio } = usePreferences();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const nextEpNumber = currentEpNumber + 1;
  const hasNextEp = nextEpNumber <= (anime.episodes || 12);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {/* Left Card: Current Episode Information & Return Button */}
      <div className="md:col-span-2 bg-[#16181f] border border-[#262626] p-4 rounded-xs flex flex-col justify-between space-y-4">
        {/* Title, Return Link & Metadata */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
              {currentEpNumber} : {anime.title}
            </h2>

            {/* Return to Anime Details Page Button */}
            <Link
              href={`/anime/${anime.id}`}
              className="text-xs font-semibold text-[#22c55e] hover:underline flex items-center gap-1 bg-[#121212] border border-[#262626] px-2.5 py-1 rounded-2xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Anime Details</span>
            </Link>
          </div>

          {(anime.views || anime.releaseTime) && (
            <p className="text-xs text-[#808080]">
              {[anime.views, anime.releaseTime].filter(Boolean).join(' • ')}
            </p>
          )}
          <p className="text-xs font-semibold text-[#22c55e]">
            {anime.romajiTitle || anime.title}
            {anime.studio ? ` (${anime.studio})` : ''}
          </p>

          {/* Episode Description */}
          <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed pt-1 border-t border-[#242832]">
            {anime.synopsis || 'No synopsis available for this episode.'}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#242832]">
          {/* Audio Switcher Button (SUB / DUB) */}
          <button
            onClick={() => setSelectedAudio(selectedAudio === 'SUB' ? 'DUB' : 'SUB')}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs px-3 py-1 rounded-xs transition-colors flex items-center gap-1"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{selectedAudio}</span>
          </button>

          {/* Add to List Button */}
          <button
            onClick={() => setIsBookmarked((prev) => !prev)}
            className={`font-bold text-xs px-3 py-1 rounded-xs transition-colors flex items-center gap-1 ${
              isBookmarked
                ? 'bg-white text-black'
                : 'bg-[#22c55e] hover:bg-[#16a34a] text-black'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{isBookmarked ? 'In List' : 'Add to List'}</span>
          </button>

          {/* Favorite Heart Button */}
          <button
            onClick={() => setIsFavorite((prev) => !prev)}
            className={`p-1.5 rounded-xs transition-colors ${
              isFavorite
                ? 'bg-rose-600 text-white'
                : 'bg-rose-500/80 hover:bg-rose-600 text-white'
            }`}
            title="Favorite Episode"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* Right Card: Next Episode Preview Card */}
      <div className="md:col-span-1 bg-[#16181f] border border-[#262626] p-4 rounded-xs flex flex-col justify-between space-y-3">
        {/* Header: Next Episode Title + Auto Next Toggle */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white">Next Episode</span>

          {/* Auto Next Toggle Switch */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-[10px] font-semibold text-[#22c55e]">Auto Next</span>
            <input
              type="checkbox"
              checked={autoNext}
              onChange={() => setAutoNext((prev) => !prev)}
              className="sr-only"
            />
            <div
              className={`w-7 h-3.5 rounded-full transition-colors relative ${
                autoNext ? 'bg-[#22c55e]' : 'bg-[#2a2a2a]'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 bg-black rounded-full absolute top-0.5 transition-transform ${
                  autoNext ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
        </div>

        {/* Next Episode Thumbnail & Info */}
        {hasNextEp ? (
          <Link
            href={`/watch/${anime.id}/${nextEpNumber}`}
            className="group flex items-center gap-3 pt-1 hover:opacity-90 transition-opacity"
          >
            {/* Thumbnail */}
            <div className="relative w-24 aspect-[16/9] bg-[#121212] rounded-2xs overflow-hidden flex-shrink-0 border border-[#2a2a2a]">
              {anime.poster ? (
                <Image
                  src={anime.poster}
                  alt={`Episode ${nextEpNumber}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : null}
              {anime.duration ? (
                <div className="absolute bottom-0.5 right-0.5 bg-black/90 text-[9px] font-bold text-white px-1 py-0.2 rounded-2xs">
                  {anime.duration}
                </div>
              ) : null}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <h4 className="text-xs font-bold text-white group-hover:text-[#22c55e] transition-colors truncate">
                {nextEpNumber} : Episode {nextEpNumber}
              </h4>
              <p className="text-[10px] text-gray-400 truncate">
                {anime.romajiTitle || anime.title}
              </p>
              {anime.releaseTime ? (
                <p className="text-[9px] text-[#808080]">
                  {anime.releaseTime}
                </p>
              ) : null}
            </div>
          </Link>
        ) : (
          <div className="text-xs text-gray-500 py-4 text-center">
            No further episodes available.
          </div>
        )}
      </div>
    </div>
  );
}
