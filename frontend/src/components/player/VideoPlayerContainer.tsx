'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, AlertCircle, Server, Loader2 } from 'lucide-react';
import { AniKotoClient } from '@/lib/api/anikoto';

export interface ServerOption {
  linkId: string;
  name: string;
  type: string;
}

interface VideoPlayerContainerProps {
  poster: string;
  title: string;
  episodeNumber: number;
  servers?: ServerOption[];
  initialStreamUrl?: string;
}

export function VideoPlayerContainer({
  poster,
  title,
  episodeNumber,
  servers = [],
  initialStreamUrl = '',
}: VideoPlayerContainerProps) {
  const [hasStarted, setHasStarted] = useState(true);
  const [currentStreamUrl, setCurrentStreamUrl] = useState(initialStreamUrl);
  const [activeLinkId, setActiveLinkId] = useState<string>(servers[0]?.linkId || '');
  const [isSwitchingServer, setIsSwitchingServer] = useState(false);

  useEffect(() => {
    setCurrentStreamUrl(initialStreamUrl);
    if (servers.length > 0) {
      setActiveLinkId(servers[0].linkId);
    }
  }, [initialStreamUrl, servers]);

  const handleSelectServer = async (server: ServerOption) => {
    if (server.linkId === activeLinkId && currentStreamUrl) return;
    setActiveLinkId(server.linkId);
    setIsSwitchingServer(true);

    try {
      const streamInfo = await AniKotoClient.getStreamInfo(server.linkId);
      setCurrentStreamUrl(streamInfo?.url || '');
    } catch (error) {
      console.error('Failed to switch server:', error);
      setCurrentStreamUrl('');
    } finally {
      setIsSwitchingServer(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Server Selector Bar */}
      {servers.length > 0 && (
        <div className="bg-[#16181f] border border-[#262626] p-2.5 rounded-xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
            <Server className="w-4 h-4 text-[#22c55e]" />
            <span className="uppercase text-[11px] tracking-wider text-gray-400">Select Server:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {servers.map((server, index) => {
              const isActive = server.linkId === activeLinkId;
              const typeLabel = server.type ? ` (${server.type.toUpperCase()})` : '';

              return (
                <button
                  key={`${server.linkId}-${index}`}
                  onClick={() => handleSelectServer(server)}
                  disabled={isSwitchingServer}
                  className={`px-3 py-1 text-xs font-bold rounded-2xs transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#22c55e] text-black shadow-md'
                      : 'bg-[#121212] border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-gray-500'
                  }`}
                >
                  {isSwitchingServer && isActive ? (
                    <Loader2 className="w-3 h-3 animate-spin text-black" />
                  ) : null}
                  <span>
                    {server.name || `Server ${index + 1}`}
                    <span className={isActive ? 'text-black/80' : 'text-gray-400'}>{typeLabel}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Video Player Viewport Container (16:9 Aspect Ratio) */}
      <div className="relative w-full aspect-[16/9] max-h-[720px] bg-black border border-[#262626] rounded-xs overflow-hidden shadow-2xl">
        {isSwitchingServer ? (
          <div className="absolute inset-0 w-full h-full bg-black/90 flex flex-col items-center justify-center text-white gap-2 z-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#22c55e]" />
            <span className="text-xs text-gray-400 font-semibold">Switching streaming server...</span>
          </div>
        ) : hasStarted && currentStreamUrl ? (
          <iframe
            src={currentStreamUrl}
            title={`${title} - Episode ${episodeNumber}`}
            className="absolute inset-0 w-full h-full border-0 bg-black z-10"
            referrerPolicy="origin"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/90 group cursor-pointer p-4 text-center"
            onClick={() => setHasStarted(true)}
          >
            {poster && poster.trim() !== '' ? (
              <Image
                src={poster}
                alt={`${title} - Episode ${episodeNumber}`}
                fill
                priority
                className="object-cover opacity-40 group-hover:opacity-60 transition-opacity"
              />
            ) : null}

            {currentStreamUrl ? (
              /* Play Button Overlay */
              <div className="relative z-10 w-16 h-16 rounded-full bg-[#22c55e] text-black flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 fill-black ml-1" />
              </div>
            ) : (
              /* Stream Unavailable Overlay */
              <div className="relative z-10 flex flex-col items-center gap-3 bg-black/80 p-6 rounded-md border border-[#333]">
                <AlertCircle className="w-10 h-10 text-amber-500" />
                <div className="space-y-1">
                  <h3 className="text-white font-bold text-base">Stream Currently Unavailable</h3>
                  <p className="text-gray-400 text-xs max-w-md">
                    Unable to load this server. Please try selecting a different server from the options above.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
