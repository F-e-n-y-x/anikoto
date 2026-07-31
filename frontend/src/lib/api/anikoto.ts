// frontend/src/lib/api/anikoto.ts

// NOTE: Server components (RSC) run in Node and need a fully-qualified
// URL — but the browser needs a host-relative one so it resolves against
// whatever address was actually used to reach the page (localhost, a LAN
// IP from a phone, a real domain in prod, etc.), not a baked-in hostname.
const API_BASE_URL =
  typeof window === 'undefined'
    ? process.env.API_INTERNAL_BASE || 'http://localhost:4444/api'
    : process.env.NEXT_PUBLIC_API_BASE || '/api';

export interface AniKotoResponse<T> {
  success: boolean;
  results?: T;
  message?: string;
}

export function mapAniKotoItem(item: any): any {
  const rawPoster = item.poster || '';
  const rawBanner = item.banner || item.backgroundImage || rawPoster;

  // Only enhance image quality if hosted on AniList CDN
  const poster = rawPoster.includes('anilist.co')
    ? rawPoster.replace('/cover/medium/', '/cover/large/').replace('/thumbnail/', '/cover/large/')
    : rawPoster;
  const banner = rawBanner.includes('anilist.co')
    ? rawBanner.replace('/cover/medium/', '/banner/').replace('/cover/large/', '/banner/').replace('/thumbnail/', '/banner/')
    : rawBanner;

  return {
    id: (item.slug || item.id || '').replace(/-episode-\d+$/, '').replace(/-ep-\d+$/, '').replace(/\/ep-\d+$/, ''),
    title: item.title,
    romajiTitle: item.japaneseTitle,
    poster: poster,
    banner: banner,
    synopsis: item.description || item.synopsis || '',
    rating: item.rating || item.malScore || undefined,
    subDub: item.sub && item.dub ? 'SUB/DUB' : item.sub ? 'SUB' : item.dub ? 'DUB' : undefined,
    // NOTE: `total` is the series' planned episode COUNT, not the latest
    // released episode — for ongoing anime those differ a lot (e.g. sub: 12
    // released out of a total: 24), and using `total` here pointed "latest
    // episode" links at episodes that don't exist yet. `sub`/`dub` reflect
    // how many episodes have actually aired, so prefer whichever is higher.
    currentEpisode: item.episode_no || Math.max(item.sub || 0, item.dub || 0) || item.total || item.episodes?.sub || undefined,
    type: item.type,
    releaseTime: item.time || item.date || undefined,
  };
}

export class AniKotoClient {
  private static async fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: AniKotoResponse<T> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `API request failed with status ${response.status}`);
      }

      return data.results as T;
    } catch (error) {
      console.error(`AniKoto API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // --- Home / Discovery ---
  
  static async getHomeInfo() {
    return this.fetchAPI<any>('/');
  }
  
  static async getSpotlight() {
    return this.fetchAPI<any[]>('/spotlight');
  }

  static async getTrending() {
    return this.fetchAPI<any[]>('/trending');
  }

  static async getTopTen() {
    return this.fetchAPI<any>('/top-ten');
  }

  static async getLatestUpdated(page: number = 1) {
    const params = new URLSearchParams({ page: page.toString() });
    return this.fetchAPI<any>(`/latest-updated?${params.toString()}`);
  }

  static async getNewRelease() {
    return this.fetchAPI<any>('/new-release');
  }

  static async getTrendingSidebar() {
    return this.fetchAPI<any[]>('/trending-sidebar');
  }

  static async getRandomAnime() {
    return this.fetchAPI<any>('/random');
  }

  // --- Search ---

  static async search(keyword: string, page: number = 1) {
    const params = new URLSearchParams({ keyword, page: page.toString() });
    return this.fetchAPI<any>(`/search?${params.toString()}`);
  }

  static async searchSuggest(keyword: string) {
    const params = new URLSearchParams({ keyword });
    return this.fetchAPI<any>(`/search/suggest?${params.toString()}`);
  }

  // --- Anime Info ---

  static async getFilter(params: any = {}) {
    const searchParams = new URLSearchParams();
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, params[key].toString());
      }
    }
    return this.fetchAPI<any>(`/filter?${searchParams.toString()}`);
  }

  static async getSchedule(date?: string) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    
    try {
      const data = await this.fetchAPI<any>(`/schedule?${params.toString()}`);
      const list = Array.isArray(data) ? data : data?.results || data?.data;
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    } catch {
      // ignore & fallback to AniList
    }

    return this.fetchAniListSchedule(date);
  }

  private static async fetchAniListSchedule(dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
    const start = Math.floor(targetDate.getTime() / 1000);
    const end = start + 86400;

    const query = `
      query ($airingAt_greater: Int, $airingAt_lesser: Int) {
        Page(page: 1, perPage: 50) {
          airingSchedules(airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: TIME) {
            id
            episode
            airingAt
            media {
              id
              title {
                userPreferred
                english
                romaji
              }
              coverImage {
                extraLarge
                large
              }
              bannerImage
              format
              episodes
              genres
              averageScore
            }
          }
        }
      }
    `;

    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { airingAt_greater: start, airingAt_lesser: end } }),
      });
      const json = await res.json();
      const schedules = json.data?.Page?.airingSchedules || [];

      return schedules.map((item: any) => {
        const media = item.media || {};
        const airingDate = new Date(item.airingAt * 1000);
        const hours = airingDate.getHours().toString().padStart(2, '0');
        const minutes = airingDate.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hours}:${minutes} JST`;

        const title = media.title?.userPreferred || media.title?.english || media.title?.romaji || 'Anime';
        const romaji = media.title?.romaji || title;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        return {
          id: slug || media.id?.toString(),
          title: title,
          japaneseTitle: romaji,
          poster: media.coverImage?.extraLarge || media.coverImage?.large,
          banner: media.bannerImage || media.coverImage?.extraLarge,
          type: media.format || 'TV',
          sub: 1,
          dub: 0,
          episode_no: item.episode,
          time: timeStr,
          malScore: media.averageScore ? (media.averageScore / 10).toFixed(1) : undefined,
        };
      });
    } catch (err) {
      console.error('Error fetching AniList schedule:', err);
      return [];
    }
  }

  static async getAnimeInfo(id: string) {
    const params = new URLSearchParams({ id });
    return this.fetchAPI<any>(`/info?${params.toString()}`);
  }

  static async getEpisodes(id: string) {
    return this.fetchAPI<any>(`/episodes/${id}`);
  }
  
  static async getEpisodesAjax(id: string) {
    return this.fetchAPI<any>(`/episodes-ajax/${id}`);
  }

  // --- Streaming ---

  static async getStreamInfo(linkId: string) {
    const params = new URLSearchParams({ id: linkId });
    return this.fetchAPI<any>(`/stream?${params.toString()}`);
  }

  static async getServerList(episodeIds: string) {
    const params = new URLSearchParams({ ids: episodeIds });
    return this.fetchAPI<any>(`/servers?${params.toString()}`);
  }
  
  static async getWatchPage(slug: string, ep?: string | number) {
    const params = new URLSearchParams();
    if (slug) params.append('slug', slug);
    if (ep) params.append('ep', ep.toString());
    return this.fetchAPI<any>(`/watch?${params.toString()}`);
  }
}
