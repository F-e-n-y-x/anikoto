'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, PlayCircle, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { AnimeItem } from '@/lib/mockData';

interface HeroBannerProps {
  slides?: AnimeItem[];
}

const FALLBACK_HERO_ANIME: AnimeItem = {
  id: 'oshi-no-ko-2nd-season',
  title: '"Oshi no Ko" 2nd Season',
  romajiTitle: 'Oshi no Ko 2nd Season',
  nativeTitle: '【推しの子】第2期',
  poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx166531-ERB8D56tJg5Y.jpg',
  banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/166531-w2vE9rFjOslE.jpg',
  type: 'TV',
  episodes: 12,
  currentEpisode: 3,
  rating: 8.9,
  subDub: 'SUB',
  status: 'RELEASING',
  studio: 'Doga Kobo',
  season: 'Summer',
  year: 2024,
  duration: '24 min/ep',
  genres: ['Drama', 'Supernatural', 'Showbiz'],
  synopsis:
    'With the help of producer Masaya Kaburagi, Aquamarine "Aqua" Hoshino and Kana Arima have landed the roles of Touki and Tsurugi in Lala Lai Theatrical Company\'s stage adaptation of 2.5D Manga Tokyo Blade...',
};

export function HeroBanner({ slides }: HeroBannerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slideItems = slides && slides.length > 0 ? slides : [FALLBACK_HERO_ANIME];
  const currentAnime = slideItems[currentSlideIndex] || slideItems[0] || FALLBACK_HERO_ANIME;

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slideItems.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slideItems.length) % slideItems.length);
  };

  const bannerImg = currentAnime.banner || currentAnime.poster;

  return (
    <div className="relative w-full bg-[#121212] border border-[#262626] rounded-2xs overflow-hidden p-6 sm:p-10 min-h-[320px] flex items-center justify-between shadow-2xl">
      {/* 1. Full-Width Banner Background Image */}
      {bannerImg ? (
        <Image
          src={bannerImg}
          alt={currentAnime.title}
          fill
          priority
          className="object-cover opacity-35 transition-all duration-700 ease-out"
        />
      ) : null}

      {/* 2. Gradient Overlay for Cinematic Contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0c0d10] via-[#0c0d10]/90 to-transparent z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d10] via-transparent to-transparent z-0" />

      {/* 3. Left Content Column */}
      <div className="relative z-10 max-w-xl space-y-4">
        {/* Spotlight Tag & Mobile Navigation */}
        <div className="flex items-center justify-between">
          <span className="bg-[#22c55e] text-black font-extrabold text-[10px] px-2.5 py-0.5 uppercase tracking-widest rounded-2xs">
            #{currentSlideIndex + 1} SPOTLIGHT
          </span>

          {/* Mobile Navigation Arrows */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <button
              onClick={handlePrevSlide}
              className="p-1.5 bg-black/80 border border-[#2a2a2a] text-gray-300 hover:text-white rounded-2xs"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextSlide}
              className="p-1.5 bg-black/80 border border-[#2a2a2a] text-gray-300 hover:text-white rounded-2xs"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
          {currentAnime.title}
        </h1>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {currentAnime.rating && (
            <span className="bg-black/80 border border-[#2a2a2a] text-amber-400 text-[11px] font-bold px-2.5 py-0.5 rounded-2xs flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {currentAnime.rating} (AniList)
            </span>
          )}
          {currentAnime.currentEpisode && (
            <span className="bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 text-[11px] font-bold px-2.5 py-0.5 rounded-2xs">
              EP {currentAnime.currentEpisode} / {currentAnime.episodes || '?'}
            </span>
          )}
          <span className="bg-black/80 border border-[#2a2a2a] text-gray-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-2xs">
            {currentAnime.type || 'TV'}
          </span>
        </div>

        {/* Synopsis */}
        <p className="text-xs sm:text-sm text-gray-300 line-clamp-3 leading-relaxed drop-shadow-sm">
          {currentAnime.synopsis}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-2">
          <Link
            href={`/watch/${currentAnime.id}/${currentAnime.currentEpisode || 1}`}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xs flex items-center gap-2 transition-colors shadow-lg"
          >
            <Play className="w-4 h-4 fill-black" />
            Watch Ep {currentAnime.currentEpisode || 1}
          </Link>

          <Link
            href={`/anime/${currentAnime.id}`}
            className="text-white hover:text-[#22c55e] text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors bg-black/60 border border-[#262626] px-4 py-2 rounded-xs"
          >
            <PlayCircle className="w-4 h-4 text-[#22c55e]" />
            View Details
          </Link>
        </div>
      </div>

      {/* 4. Desktop Navigation Controls */}
      <div className="relative z-10 hidden sm:flex items-center gap-3">
        <button
          onClick={handlePrevSlide}
          className="p-3 bg-black/80 hover:bg-[#22c55e] hover:text-black border border-[#262626] text-white rounded-2xs transition-all shadow-xl"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNextSlide}
          className="p-3 bg-black/80 hover:bg-[#22c55e] hover:text-black border border-[#262626] text-white rounded-2xs transition-all shadow-xl"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
