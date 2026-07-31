import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function EmptyState({
  title = 'No Content Found',
  description = 'There are no anime items available at the moment.',
  onRetry,
}: EmptyStateProps) {
  return (
    <div className="w-full py-10 px-4 bg-[#141414] border border-[#262626] rounded-2xs flex flex-col items-center justify-center text-center space-y-2">
      <AlertCircle className="w-8 h-8 text-gray-500 mb-1" />
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="text-xs text-gray-400 max-w-sm">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-xs font-semibold text-[#22c55e] border border-[#22c55e]/40 hover:bg-[#22c55e] hover:text-black px-3 py-1 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
