/*
 * ======= • ======= • ======= • ======= • =======• =======
 * AniKotoAPI — random.extractor.js
 * Repository: https://github.com/Shineii86/AniKotoAPI
 *
 * @description
 *   Fetches a random anime from anikototv.to by following the redirect
 *   chain from the random endpoint, then extracts the full anime detail
 *   page metadata from the resolved URL.
 *
 * @exports
 *   extractRandom
 *
 * @author  Shinei Nouzen
 * @license MIT
 * ======= • ======= • ======= • ======= • =======• =======
 */

import * as cheerio from "cheerio";
import { fetchWithMirror } from "../helper/mirror.helper.js";
import { extractSlug } from "../helper/slug.helper.js";

// ══════════════════════════════════════════════════════════════
// RANDOM ANIME EXTRACTOR
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Fetch a random anime and extract its detail metadata ----
/**
 * Hits the random endpoint on anikototv.to which redirects to a random
 * anime page. Follows up to 5 redirects, extracts the final URL to get
 * the slug, then parses the full anime detail page for metadata.
 *
 * @returns {Promise<Object>} Random anime data with slug, title, poster, synopsis, etc.
 *
 * @example
 *   const random = await extractRandom();
 *   console.log(random.title); // random anime title
 *   console.log(random.url);   // full resolved URL
 */
const extractRandom = async () => {
  try {
    // NOTE: maxRedirects=5 allows following the redirect chain from /random
    // to the final anime page. Routed through fetchWithMirror so this
    // endpoint gets the same mirror-fallback resilience as every other
    // extractor instead of failing outright if the primary domain is down.
    const { data, finalUrl } = await fetchWithMirror("/random", { maxRedirects: 5 });
    const slug = extractSlug(finalUrl);

    const $ = cheerio.load(data);

    const title = $("h1[itemprop='name'].title.d-title").text().trim() || "";
    const japaneseTitle = $("h1[itemprop='name'].title.d-title").attr("data-jp") || "";
    const poster = $("img[itemprop='image']").attr("src") || "";

    const type = $(".bmeta .meta:first-child > div:nth-child(1) span").text().trim() || "";
    const synopsis = $(".synopsis .content").text().trim() || "";
    const rating = $("#w-rating .score .value").text().trim() || "";
    const animeId = parseInt($("#watch-main").attr("data-id")) || 0;

    const genres = [];
    $(".bmeta .meta:first-child > div:nth-child(5) span a[href*='/genre/']").each((i, el) => {
      genres.push($(el).text().trim());
    });

    return {
      slug,
      animeId,
      title,
      japaneseTitle,
      poster,
      type,
      synopsis,
      rating,
      genres,
      url: finalUrl
    };
  } catch (error) {
    throw error;
  }
};

export { extractRandom };

// ══════════════════════════════════════════════════════════════ END: random.extractor.js
