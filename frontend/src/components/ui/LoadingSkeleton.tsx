import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'text' | 'thumbnail' | 'banner';
}

export function LoadingSkeleton({
  className = '',
  variant = 'rectangular',
}: LoadingSkeletonProps) {
  const baseStyle = 'bg-[#1a1a1a] animate-pulse rounded-2xs';

  const variantStyles = {
    rectangular: 'w-full h-full min-h-[16px]',
    text: 'w-full h-3 my-1',
    thumbnail: 'w-full aspect-[16/9]',
    banner: 'w-full h-[280px] sm:h-[340px]',
  };

  return (
    <div
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
    />
  );
}

export function ShellPageSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* Banner Skeleton */}
      <LoadingSkeleton variant="banner" className="bg-[#1c1c1c] border border-[#262626]" />

      {/* Grid Section Skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-44 bg-[#1c1c1c] rounded-2xs" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <LoadingSkeleton variant="thumbnail" className="bg-[#1c1c1c]" />
              <LoadingSkeleton variant="text" className="w-3/4 bg-[#1c1c1c]" />
              <LoadingSkeleton variant="text" className="w-1/2 bg-[#1a1a1a]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
