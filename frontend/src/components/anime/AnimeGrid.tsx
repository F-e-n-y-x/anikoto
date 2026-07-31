'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AnimeItem } from '@/lib/mockData';
import { AnimeCard } from './AnimeCard';
import { usePreferences } from '@/context/PreferenceContext';

interface AnimeGridProps {
  title: string;
  items: AnimeItem[];
  icon?: React.ReactNode;
  viewAllHref?: string;
  showProgress?: boolean;
  aspect?: 'landscape' | 'portrait';
  showTabs?: boolean;
}

export function AnimeGrid({
  title,
  items,
  icon,
  viewAllHref,
  showProgress = false,
  aspect = 'landscape',
  showTabs = false,
}: AnimeGridProps) {
  const { audioMode: activeTab, setAudioMode: setActiveTab } = usePreferences();

  const filteredItems = items.filter((item) => {
    if (!showTabs) return true;
    if (activeTab === 'SUB') return item.subDub === 'SUB' || item.subDub === undefined;
    if (activeTab === 'DUB') return item.subDub === 'DUB';
    return true;
  });

  return (
    <section className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {title}
          </h2>
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-gray-400 hover:text-white transition-colors"
            title="View All"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Filter Tabs (SUB, DUB) */}
      {showTabs && (
        <div className="flex items-center gap-2 pt-1">
          {(['SUB', 'DUB'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-0.5 text-[11px] font-bold rounded-2xs uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? 'bg-[#181818] text-[#22c55e] border border-[#22c55e]'
                  : 'bg-[#181818] text-gray-400 border border-[#262626] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* 4-Column Grid for Landscape Cards matching Reference Screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
        {filteredItems.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} aspect={aspect} showProgress={showProgress} />
        ))}
      </div>
    </section>
  );
}
