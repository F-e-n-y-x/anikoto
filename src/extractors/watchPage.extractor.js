/*
 * ======= • ======= • ======= • ======= • =======• =======
 * AniKotoAPI — watchPage.extractor.js
 * Repository: https://github.com/Shineii86/AniKotoAPI
 *
 * @description
 *   Extracts the full watch/episode page data from anikototv.to including
 *   anime metadata, server list, trending sidebar, and recommended anime.
 *
 * @exports
 *   extractWatchPage
 *
 * @author  Shinei Nouzen
 * @license MIT
 * ======= • ======= • ======= • ======= • =======• =======
 */

import * as cheerio from "cheerio";
import { fetchWithMirror } from "../helper/mirror.helper.js";
import { extractSlug } from "../helper/slug.helper.js";
import { extractEpisodeList } from "./episodeList.extractor.js";
import { extractServerList } from "./streamInfo.extractor.js";

// ══════════════════════════════════════════════════════════════
// WATCH PAGE EXTRACTOR
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Extract complete watch page data for a specific episode ----
/**
 * Fetches and parses the episode watch page from anikototv.to. Extracts
 * anime metadata, episode details, available streaming servers, trending
 * sidebar, and recommended anime.
 *
 * @param {string} slug - The anime slug (e.g. "one-piece")
 * @param {string|number} ep - The episode number to watch
 * @returns {Promise<Object>} Full watch page data object
 *
 * @example
 *   const watchData = await extractWatchPage("one-piece", 100);
 *   console.log(watchData.servers.length); // number of available servers
 *   console.log(watchData.title);          // anime title
 */
const extractWatchPage = async (slug, ep) => {
  try {
    const path = `/watch/${encodeURIComponent(slug)}/ep-${encodeURIComponent(ep)}`;
    const { data } = await fetchWithMirror(path);
    const $ = cheerio.load(data);

    const animeId = parseInt($("#watch-main").attr("data-id")) || 0;
    const animeUrl = $("#watch-main").attr("data-url") || "";
    const title = $("h1[itemprop='name'].title.d-title").text().trim() || slug;
    const japaneseTitle = $("h1[itemprop='name'].title.d-title").attr("data-jp") || "";
    const episodeNumber = parseInt(ep) || 0;

    const synopsis = $(".synopsis .content").text().trim() || "";
    const rating = $("#w-rating .score .value").text().trim() || "";
    const poster = $("img[itemprop='image']").attr("src") || "";
    const backgroundImage = $("#player").css("background-image")?.match(/url\(['"]?(.+?)['"]?\)/)?.[1] || "";

    const type = $(".bmeta .meta:first-child > div:nth-child(1) span").text().trim() || "";
    const status = $(".bmeta .meta:first-child > div:nth-child(4) span a").text().trim() || "";
    const malScore = $(".bmeta .meta:nth-child(2) > div:nth-child(1) span").text().trim() || "";
    const duration = $(".bmeta .meta:nth-child(2) > div:nth-child(2) span").text().trim() || "";
    const episodes = $(".bmeta .meta:nth-child(2) > div:nth-child(3) span").text().trim() || "";

    const genres = [];
    $(".bmeta .meta:first-child > div:nth-child(5) span a[href*='/genre/']").each((i, el) => {
      genres.push($(el).text().trim());
    });

    const studios = [];
    $(".bmeta .meta:nth-child(2) > div:nth-child(4) span a[itemprop='director'] span[itemprop='name']").each((i, el) => {
      studios.push($(el).text().trim());
    });

    const nextEpisodeDate = $(".next-episode, .alert.next-episode").text().trim() || "";
    const nextEpisodeTimestamp = parseInt($(".count-down").attr("data-target")) || 0;

    // NOTE: #w-servers is always empty in the raw HTML — the live site
    // populates it client-side via JS after an AJAX call keyed on the
    // *current episode's* encoded server_ids blob (not its plain numeric
    // id). Resolve that blob from the episode list, then fetch real
    // servers the same way the site's own front-end does.
    let servers = [];
    try {
      const epList = await extractEpisodeList(animeId || slug);
      const currentEp = (epList.episodes || []).find((e) => e.episode_no === episodeNumber);
      if (currentEp && currentEp.server_ids) {
        const rawServers = await extractServerList(currentEp.server_ids);
        servers = rawServers.map((s) => ({
          linkId: s.link_id,
          epId: s.ep_id,
          cmId: s.cmid,
          svId: s.sv_id,
          name: s.name,
          type: s.type
        }));
      }
    } catch (serverError) {
      servers = [];
    }

    const trending = [];
    $(".w-side-section:first .scaff.side.items a.item, #watch-order a.item").each((i, el) => {
      const trendSlug = extractSlug($(el).attr("href"));
      const trendPoster = $(el).find(".poster img").attr("src") || "";
      const trendTitle = $(el).find(".name").text().trim() || "";
      const trendType = $(el).find(".dot:last-child").text().trim() || "";
      const trendScore = $(el).find(".score").text().trim() || "";

      if (trendSlug) {
        trending.push({
          slug: trendSlug,
          poster: trendPoster,
          title: trendTitle,
          type: trendType,
          score: trendScore
        });
      }
    });

    const recommended = [];
    $(".w-side-section:has(.title:contains('Recommended')) a.item, aside.sidebar:last .w-side-section a.item").each((i, el) => {
      const recSlug = extractSlug($(el).attr("href"));
      const recPoster = $(el).find(".poster img").attr("src") || "";
      const recTitle = $(el).find(".name").text().trim() || "";
      const recType = $(el).find(".dot:last-child").text().trim() || "";

      if (recSlug) {
        recommended.push({
          slug: recSlug,
          poster: recPoster,
          title: recTitle,
          type: recType
        });
      }
    });

    return {
      slug,
      animeId,
      animeUrl,
      title,
      japaneseTitle,
      episodeNumber,
      synopsis,
      type,
      status,
      malScore,
      duration,
      episodes,
      studios,
      genres,
      rating,
      poster,
      backgroundImage,
      nextEpisodeDate,
      nextEpisodeTimestamp,
      servers,
      trending,
      recommended
    };
  } catch (error) {
    throw error;
  }
};

export { extractWatchPage };

// ══════════════════════════════════════════════════════════════ END: watchPage.extractor.js
