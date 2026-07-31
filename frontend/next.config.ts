import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // NOTE: this project lives inside the AniKotoAPI repo (its own
  // package-lock.json at the root), so pin the trace root here to
  // silence Next's "multiple lockfiles" workspace-root guess.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
      },
      {
        protocol: 'https',
        hostname: '*.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 'media.kitsu.io',
      },
      {
        protocol: 'https',
        hostname: 'cdn.anipixcdn.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
