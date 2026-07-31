import React from 'react';

export default function Loading() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="w-full h-[280px] bg-[#1e1e1e] border border-[#262626] rounded-xs" />

      {/* Grid Section Skeletons */}
      <div className="space-y-3">
        <div className="h-6 w-44 bg-[#222] rounded-2xs" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-[#181818] border border-[#262626] rounded-2xs" />
          ))}
        </div>
      </div>
    </div>
  );
}
