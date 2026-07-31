'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Search, Filter, Loader2 } from 'lucide-react';
import { AnimeItem } from '@/lib/mockData';
import { AniKotoClient, mapAniKotoItem } from '@/lib/api/anikoto';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { EmptyState } from '@/components/ui/EmptyState';

function getWeekDates() {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return days.map((key, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = d.toDateString() === now.toDateString();
    return {
      key,
      label: labels[index],
      dateStr,
      isToday,
    };
  });
}

export default function SchedulePage() {
  const weekDays = useMemo(() => getWeekDates(), []);
  const todayKey = useMemo(() => weekDays.find((d) => d.isToday)?.key || 'MON', [weekDays]);

  const [items, setItems] = useState<AnimeItem[]>([]);
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const activeDayObj = useMemo(
    () => weekDays.find((d) => d.key === selectedDay) || weekDays[0],
    [weekDays, selectedDay]
  );

  useEffect(() => {
    document.title = 'YUGENANIME - Airing Schedule';
  }, []);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await AniKotoClient.getSchedule(activeDayObj.dateStr);
        const arrayData = Array.isArray(data) ? data : data?.results || data?.data || [];
        const formattedResults = (arrayData || []).map((item: any) => mapAniKotoItem(item));
        setItems(formattedResults);
      } catch (error) {
        console.error("Error loading schedule:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [activeDayObj]);

  const filteredItems = items.filter((item) => {
    if (selectedFormat !== 'ALL' && item.type !== selectedFormat) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.romajiTitle?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[#22c55e]" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Weekly Airing Schedule
          </h1>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          Broadcast times & release countdowns from AniList
        </span>
      </div>

      {/* Days Bar */}
      <div className="bg-[#181818] border border-[#262626] p-2.5 rounded-2xs flex items-center gap-2 overflow-x-auto no-scrollbar">
        {weekDays.map((day) => {
          const isSelected = selectedDay === day.key;

          return (
            <button
              key={day.key}
              onClick={() => setSelectedDay(day.key)}
              className={`relative px-4 py-2 text-xs font-bold rounded-2xs transition-colors flex-shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#22c55e] text-black shadow-md'
                  : 'bg-[#121212] border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-gray-500'
              }`}
            >
              <span>{day.label}</span>
              {day.isToday && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded-2xs font-extrabold uppercase ${
                    isSelected ? 'bg-black text-[#22c55e]' : 'bg-[#22c55e] text-black'
                  }`}
                >
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#181818] border border-[#262626] p-4 rounded-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex items-center w-full sm:w-72">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schedule..."
            className="w-full h-8 bg-[#121212] border border-[#2a2a2a] text-white text-xs pl-8 pr-2.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-bold text-gray-400 uppercase">Format:</span>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="h-8 bg-[#121212] border border-[#2a2a2a] text-white text-xs font-semibold px-2.5 rounded-2xs focus:outline-none focus:border-[#22c55e]"
          >
            <option value="ALL">All Formats</option>
            <option value="TV">TV Series</option>
            <option value="MOVIE">Movies</option>
            <option value="OVA">OVA / Specials</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-[#22c55e] mr-2" />
          <span>Loading Airing Schedule for {activeDayObj.label}...</span>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((anime) => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              aspect="landscape"
              variant="schedule"
              dayLabel={activeDayObj.label}
              isToday={activeDayObj.isToday}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Airing Anime Found"
          description="There are currently no anime broadcasts scheduled for this selection."
        />
      )}
    </div>
  );
}
