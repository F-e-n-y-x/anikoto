'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Flame,
  Layers,
  Compass,
  History,
  Calendar,
  X,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Trending', href: '/trending', icon: Flame },
  { name: 'Recents', href: '/recents', icon: Layers },
  { name: 'Discover', href: '/discover', icon: Compass },
  { name: 'History', href: '/history', icon: History },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
];

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/75 lg:hidden"
        />
      )}

      {/* Fixed Compact Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:z-30 w-[var(--sidebar-width)] bg-[#141414] border-r border-[#262626] flex flex-col items-center transition-transform duration-150 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } pt-[var(--top-nav-height)]`}
      >
        {/* Mobile Header Close */}
        <div className="flex items-center justify-end w-full px-3 py-2 lg:hidden border-b border-[#262626]">
          <button
            onClick={onCloseMobile}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Close sidebar menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stacked Vertical Menu Links */}
        <nav className="flex-1 w-full py-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={`relative flex flex-col items-center justify-center py-2.5 px-1 w-full text-center group transition-colors ${
                  isActive
                    ? 'text-[#22c55e]'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#22c55e]" />
                )}

                <Icon
                  className={`w-4 h-4 mb-1 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-[#22c55e]' : 'text-gray-400 group-hover:text-white'
                  }`}
                />
                <span className="text-[10px] font-medium leading-none tracking-tight">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
