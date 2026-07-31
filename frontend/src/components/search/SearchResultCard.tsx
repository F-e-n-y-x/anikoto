'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { AnimeItem } from '@/lib/mockData';

interface SearchResultCardProps {
  anime: AnimeItem;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function SearchResultCard({
  anime,
  isSelected = false,
  onSelect,
}: SearchResultCardProps) {
  return (
    <Link
      href={`/anime/${anime.id}`}
      onClick={onSelect}
      className={`flex items-center gap-3 p-2 transition-colors border-b border-[#242832] last:border-b-0 ${
        isSelected
          ? 'bg-[#22c55e]/15 text-white border-l-2 border-l-[#22c55e]'
          : 'hover:bg-[#1f232c] text-gray-200'
      }`}
    >
      {/* Compact Poster Image */}
      <div className="relative w-10 h-14 bg-[#141414] rounded-2xs overflow-hidden flex-shrink-0 border border-[#2a2a2a]">
        {anime.poster ? (
          <Image
            src={anime.poster}
            alt={anime.title}
            fill
            className="object-cover"
          />
        ) : null}
      </div>

      {/* Small Metadata Area */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#22c55e]">
          {anime.title}
        </h4>
        {anime.romajiTitle && (
          <p className="text-[11px] font-medium text-[#22c55e] truncate">
            {anime.romajiTitle}
          </p>
        )}
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-normal">
          <span>{anime.type || 'TV'}</span>
          {anime.episodes && <span>• {anime.episodes} Eps</span>}
          {anime.status && (
            <span className="uppercase text-[#22c55e] font-semibold text-[9px]">
              • {anime.status}
            </span>
          )}
        </div>
      </div>

      {/* AniList Rating Placeholder */}
      {anime.rating && (
        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-[#141414] px-1.5 py-0.5 rounded-2xs border border-[#2a2a2a] flex-shrink-0">
          <Star className="w-2.5 h-2.5 fill-amber-400" />
          <span>{anime.rating}</span>
        </div>
      )}
    </Link>
  );
}
