'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 py-1"
    >
      <Link
        href="/"
        className="hover:text-white flex items-center gap-1 transition-colors"
      >
        <Home className="w-3 h-3 text-[#22c55e]" />
        <span>Home</span>
      </Link>

      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        const label = decodeURIComponent(segment).replace(/-/g, ' ');

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
            {isLast ? (
              <span className="text-[#22c55e] font-semibold capitalize truncate max-w-[200px]">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-white capitalize transition-colors truncate max-w-[150px]"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
