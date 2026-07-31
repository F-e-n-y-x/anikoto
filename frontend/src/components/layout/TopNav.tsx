'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Shuffle, History } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { SearchInput } from '../search/SearchInput';

interface TopNavProps {
  onToggleMobileSidebar: () => void;
}

export function TopNav({ onToggleMobileSidebar }: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 w-full h-[52px] bg-[#181818] border-b border-[#262626] flex items-center justify-between px-4">
      {/* Left side: Mobile Toggle, YugenAnime SVG Logo & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 text-gray-400 hover:text-white transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* YugenAnime Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <svg
            className="w-5 h-5 transform transition-transform group-hover:scale-105"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 7L27 7L16 27L5 7Z"
              stroke="#22c55e"
              strokeWidth="4.5"
              strokeLinejoin="round"
              fill="none"
            />
            <path d="M11 12L21 12L16 20L11 12Z" fill="#22c55e" />
          </svg>
          <span className="text-white font-bold text-base tracking-tight font-sans">
            YugenAnime
          </span>
        </Link>

        {/* Breadcrumb Trail Support */}
        <div className="hidden md:block pl-3 border-l border-[#262626] overflow-hidden truncate">
          <Breadcrumbs />
        </div>
      </div>

      {/* Center: Live Interactive Search Bar */}
      <div className="hidden sm:flex items-center flex-1 max-w-xl mx-8">
        <SearchInput />
      </div>

      {/* Right side: Useful Features (Random Anime & Quick Local History - Theme Button Removed as Requested) */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* Quick History Button */}
        <Link
          href="/history"
          className="hidden sm:flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-[#1f1f1f] border border-[#2a2a2a] px-2.5 py-1 rounded-xs transition-colors"
          title="Watch History"
        >
          <History className="w-3.5 h-3.5 text-[#22c55e]" />
          <span>History</span>
        </Link>

        {/* Random Anime Feature Button */}
        <Link
          href="/anime/random"
          className="flex items-center gap-1.5 text-xs font-bold text-black bg-[#22c55e] hover:bg-[#16a34a] px-3 py-1 rounded-xs transition-colors shadow-sm"
          title="Surprise me with a random anime!"
        >
          <Shuffle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Random</span>
        </Link>
      </div>
    </header>
  );
}
