'use client';

import React, { useState } from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { PreferenceProvider } from '@/context/PreferenceContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <PreferenceProvider>
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {/* Top Header Navigation */}
        <TopNav onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

        {/* Main Layout Area: Sidebar + Page Container */}
        <div className="flex flex-1">
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />

          {/* Main Content Layout Container */}
          <main className="flex-1 lg:ml-[var(--sidebar-width)] p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto w-full transition-all">
            {children}
          </main>
        </div>
      </div>
    </PreferenceProvider>
  );
}
