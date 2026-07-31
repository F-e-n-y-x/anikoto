'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Play, Clock } from 'lucide-react';
import { AnimeItem } from '@/lib/mockData';

interface AnimeCardProps {
  anime: AnimeItem;
  aspect?: 'landscape' | 'portrait';
  showProgress?: boolean;
  variant?: 'standard' | 'feed' | 'schedule';
  dayLabel?: string;
  isToday?: boolean;
}

export function AnimeCard({
  anime,
  aspect = 'landscape',
  showProgress = false,
  variant = 'standard',
  dayLabel,
  isToday = false,
}: AnimeCardProps) {
  const isLandscape = aspect === 'landscape';
  const isFeed = variant === 'feed';
  const isSchedule = variant === 'schedule';

  return (
    <Link
      href={
        anime.currentEpisode
          ? `/watch/${anime.id}/${anime.currentEpisode}`
          : `/anime/${anime.id}`
      }
      className="group block flex flex-col h-full bg-[#181818] border border-[#262626] hover:border-[#22c55e] p-2 rounded-2xs transition-colors"
    >
      {/* Thumbnail Container */}
      <div
        className={`relative w-full bg-[#1c1c1c] overflow-hidden rounded-2xs ${
          isLandscape ? 'aspect-[16/9]' : 'aspect-[2/3]'
        }`}
      >
        {anime.poster ? (
          <Image
            src={anime.poster}
            alt={anime.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-200 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-[#121212] flex items-center justify-center text-gray-600 text-xs">
            No Image
          </div>
        )}

        {/* Hover Overlay Play Icon */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-[#22c55e] text-black flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 fill-black ml-0.5" />
          </div>
        </div>

        {/* Rating Badge (AniList Placeholder) */}
        {anime.rating && (
          <div className="absolute top-1.5 right-1.5 bg-black/85 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-2xs flex items-center gap-1 border border-white/10">
            <Star className="w-2.5 h-2.5 fill-amber-400" />
            {anime.rating}
          </div>
        )}

        {/* Sub/Dub Badge */}
        {anime.subDub && (
          <div className="absolute top-1.5 left-1.5 bg-[#22c55e] text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-2xs uppercase">
            {anime.subDub}
          </div>
        )}

        {/* Duration / Airing Time Badge */}
        {isLandscape && (isSchedule || anime.duration) && (
          <div className="absolute bottom-1 right-1 bg-black/90 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-2xs">
            {isSchedule ? anime.releaseTime || 'TBA' : anime.duration}
          </div>
        )}

        {/* Watch Progress Bar */}
        {showProgress && anime.progressPercent !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
            <div
              className="h-full bg-[#22c55e]"
              style={{ width: `${anime.progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Text Info Below Thumbnail */}
      <div className="mt-2 space-y-1 flex-1 flex flex-col justify-between">
        <div className="space-y-0.5">
          {/* Episode Title Line */}
          <h3 className="text-xs font-bold text-white group-hover:text-[#22c55e] transition-colors line-clamp-1">
            {(isFeed || isSchedule) && anime.currentEpisode ? `EP ${anime.currentEpisode} : ` : ''}
            {anime.title}
          </h3>

          {/* Subtitle Link */}
          <p className="text-[11px] font-medium text-[#22c55e] group-hover:underline truncate">
            {anime.romajiTitle || anime.title}
          </p>
        </div>

        {/* Schedule / Feed Metadata Line */}
        <div className="pt-1 border-t border-[#262626] flex items-center justify-between text-[10px] text-[#808080]">
          {isSchedule ? (
            <span className="text-[#22c55e] font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#22c55e]" />
              {isToday ? 'Airing Today' : `Airing ${dayLabel || 'Scheduled'}`}
            </span>
          ) : (
            <span>
              {[anime.views, anime.releaseTime].filter(Boolean).join(' • ') ||
                `${anime.type || 'TV'}${anime.duration ? ` • ${anime.duration}` : ''}`}
            </span>
          )}

          {isFeed && (
            <span className="text-[#22c55e] font-bold hover:underline">
              Watch Ep {anime.currentEpisode || 1} →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
