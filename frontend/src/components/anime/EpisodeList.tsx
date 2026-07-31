'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Check, Search } from 'lucide-react';
import { EpisodeItem } from '@/lib/mockData';

interface EpisodeListProps {
  animeId: string;
  episodes: EpisodeItem[];
}

export function EpisodeList({ animeId, episodes }: EpisodeListProps) {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredEpisodes = episodes.filter((ep) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      ep.number.toString().includes(q) ||
      ep.title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Section Header & Filter Input */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-white uppercase tracking-tight">
            Episodes ({episodes.length})
          </h3>
        </div>

        {/* Episode Search Filter */}
        <div className="relative flex items-center w-48">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter episode..."
            className="w-full h-7 bg-[#141414] border border-[#2a2a2a] text-white text-xs pl-8 pr-2.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          />
        </div>
      </div>

      {/* Episode Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredEpisodes.map((ep) => (
          <Link
            key={ep.number}
            href={`/watch/${animeId}/${ep.number}`}
            className="group flex items-start gap-3 p-2 bg-[#181818] border border-[#262626] hover:border-[#22c55e] transition-colors rounded-2xs"
          >
            {/* Thumbnail Placeholder */}
            <div className="relative w-28 aspect-[16/9] bg-[#121212] overflow-hidden flex-shrink-0 rounded-2xs">
              <Image
                src={ep.thumbnail}
                alt={`Episode ${ep.number}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-[#22c55e] flex items-center justify-center shadow-md">
                  <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute bottom-1 right-1 bg-black/90 text-[9px] font-bold text-white px-1 py-0.5 rounded-2xs">
                {ep.duration}
              </div>

              {/* Watched Indicator Placeholder */}
              {ep.isWatched && (
                <div className="absolute top-1 left-1 bg-[#22c55e] text-black p-0.5 rounded-2xs" title="Watched">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Episode Meta */}
            <div className="flex-1 min-w-0 space-y-0.5 pt-0.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-[#22c55e]">
                <span>EPISODE {ep.number}</span>
                <span className="text-gray-500 font-normal">{ep.airDate}</span>
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-[#22c55e] transition-colors line-clamp-2 leading-snug">
                {ep.title}
              </h4>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
