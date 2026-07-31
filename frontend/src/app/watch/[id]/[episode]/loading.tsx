import React from 'react';

export default function PlayerLoading() {
  return (
    <div className="space-y-6 pb-12 w-full max-w-[1400px] mx-auto animate-pulse">
      {/* Video Viewport Skeleton */}
      <div className="w-full aspect-[16/9] max-h-[720px] bg-[#161616] border border-[#262626] rounded-xs flex items-center justify-center">
        <div className="text-gray-500 text-xs font-semibold">Loading Stream Viewport...</div>
      </div>

      {/* Info Bar Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 h-40 bg-[#16181f] border border-[#262626] rounded-xs" />
        <div className="md:col-span-1 h-40 bg-[#16181f] border border-[#262626] rounded-xs" />
      </div>

      {/* Episode Grid Skeleton */}
      <div className="h-48 bg-[#181818] border border-[#262626] rounded-xs" />
    </div>
  );
}
