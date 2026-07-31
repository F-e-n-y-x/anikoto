import React from 'react';
import { redirect } from 'next/navigation';
import { Layers, HeartHandshake } from 'lucide-react';
import { AniKotoClient } from '@/lib/api/anikoto';
import { AnimeDetailsHeader } from '@/components/anime/AnimeDetailsHeader';
import { EpisodeList } from '@/components/anime/EpisodeList';
import { RelatedAnimeSection } from '@/components/anime/RelatedAnimeSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnimeItem, EpisodeItem } from '@/lib/mockData';

import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (id === 'random') {
    return { title: 'Random Anime' };
  }
  try {
    const animeData = await AniKotoClient.getAnimeInfo(id);
    return {
      title: animeData?.title || 'Anime Details',
    };
  } catch {
    return {
      title: 'Anime Details',
    };
  }
}

export default async function AnimeDetailsPage({ params }: PageProps) {
  const { id } = await params;

  // NOTE: "/anime/random" (the nav bar's "Surprise me" button) is not a
  // real slug — resolve it to an actual anime and redirect there, rather
  // than trying to look up an anime literally named "random".
  if (id === 'random') {
    const random = await AniKotoClient.getRandomAnime().catch(() => null);
    if (random?.slug) {
      redirect(`/anime/${random.slug}`);
    }
    return (
      <div className="py-12">
        <EmptyState
          title="Couldn't Pick a Random Anime"
          description="The random anime service is unavailable right now. Please try again."
        />
      </div>
    );
  }

  try {
    const [animeData, episodesData] = await Promise.all([
      AniKotoClient.getAnimeInfo(id).catch(() => null),
      AniKotoClient.getEpisodes(id).catch(() => null)
    ]);

    if (!animeData) {
      return (
        <div className="py-12">
          <EmptyState
            title="Anime Details Not Found"
            description="The requested anime title could not be located in the catalog."
          />
        </div>
      );
    }

    // Map AniKoto API format to frontend AnimeItem format
    const animeDetails: AnimeItem = {
      id: animeData.slug || animeData.animeId?.toString(),
      title: animeData.title,
      romajiTitle: animeData.japaneseTitle,
      nativeTitle: animeData.altNames,
      poster: animeData.poster,
      banner: animeData.backgroundImage || animeData.poster,
      synopsis: animeData.synopsis,
      type: animeData.type,
      status: animeData.status,
      rating: animeData.malScore,
      studio: animeData.studios?.[0],
      season: animeData.premiered,
      episodes: animeData.episodes,
      duration: animeData.duration,
      genres: animeData.genres,
    };

    const episodes: EpisodeItem[] = (episodesData?.episodes || []).map((ep: any) => ({
      id: ep.id,
      number: ep.episode_no,
      title: ep.title || `Episode ${ep.episode_no}`,
      thumbnail: animeData.poster, // Use poster as fallback for episode thumbnail
      duration: animeData.duration || '24m',
      airDate: '', // Can be extracted if available
    }));

    return (
      <div className="space-y-8 pb-10">
        {/* 1. Details Header (Poster on left, details on right) */}
        <AnimeDetailsHeader anime={animeDetails} />

        {/* 2. Episode List Grid (ep list directly under details as per sketch) */}
        <EpisodeList animeId={animeDetails.id} episodes={episodes} />

        {/* 3. Related Anime (genre-based) */}
        <RelatedAnimeSection
          animeId={animeDetails.id}
          genres={animeDetails.genres}
          icon={<Layers className="w-5 h-5 text-[#22c55e]" />}
          title="Related Anime"
        />

        {/* 4. Recommendations (genre-based, different genre than above) */}
        <RelatedAnimeSection
          animeId={animeDetails.id}
          genres={animeDetails.genres}
          icon={<HeartHandshake className="w-5 h-5 text-[#22c55e]" />}
          title="You Might Also Like"
          shuffle
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading anime details:", error);
    return (
      <div className="py-12">
        <EmptyState
          title="Error Loading Anime"
          description="There was an error loading the anime details. Please try again later."
        />
      </div>
    );
  }
}
