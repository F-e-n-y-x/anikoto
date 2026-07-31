/*
 * ======= • ======= • ======= • ======= • =======• =======
 * AniKotoAPI — watchOrder.extractor.js
 * Repository: https://github.com/Shineii86/AniKotoAPI
 *
 * @description
 *   Extracts watch order and related anime information from the
 *   watch page sidebar. Returns trending/related anime with their
 *   metadata for continuous viewing.
 *
 * @exports
 *   extractWatchOrder
 *
 * @author  Shinei Nouzen
 * @license MIT
 * ======= • ======= • ======= • ======= • =======• =======
 */

import * as cheerio from "cheerio";
import { fetchWithMirror } from "../helper/mirror.helper.js";
import { extractSlug } from "../helper/slug.helper.js";

// ══════════════════════════════════════════════════════════════
// WATCH ORDER EXTRACTOR
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Watch Order / Related Anime Extraction ----
/**
 * Fetches and parses watch order / related anime for an anime.
 * Extracts related anime from the watch page sidebar.
 *
 * NOTE: The source site's AJAX endpoints (/ajax/related/) don't exist,
 * so we extract from the watch page HTML sidebar instead.
 *
 * @param {string|number} slugOrId - The anime slug or numeric ID
 * @returns {Promise<Object>} Object with animeId, totalRelated, related array
 *
 * @example
 *   const data = await extractWatchOrder("one-piece-odmau");
 *   console.log(data.totalRelated);
 */
const extractWatchOrder = async (slugOrId) => {
  try {
    const path = `/watch/${slugOrId}`;
    const { data } = await fetchWithMirror(path);

    const html = typeof data === "string" ? data : String(data);
    const $ = cheerio.load(html);

    const animeId = parseInt($("#watch-main").attr("data-id")) || 0;
    const related = [];

    // NOTE: Try dedicated related section first (#w-related)
    $("#w-related .item, .w-side-section:has(.title:contains('Related')) .item").each((_, el) => {
      const link = $(el).find("a").first();
      const href = link.attr("href") || "";
      const title = $(el).find(".name").text().trim() || "";
      const poster = $(el).find("img").attr("src") || "";
      const slug = extractSlug(href);
      const relation = $(el).find(".relation, .serieslabelitem").text().trim() || "related";

      if (slug) {
        related.push({ title, slug, poster, url: href, relation });
      }
    });

    // NOTE: Fallback — extract trending sidebar items as suggested watch order
    if (related.length === 0) {
      $(".w-side-section:has(.title:contains('Trending')) .item, .w-side-section:first .item").each((_, el) => {
        const link = $(el).find("a").first();
        const href = link.attr("href") || "";
        const title = $(el).find(".name").text().trim() || "";
        const poster = $(el).find("img").attr("src") || "";
        const slug = extractSlug(href);
        const score = $(el).find(".score").text().trim() || "";
        const type = $(el).find(".meta .dot:last-child").text().trim() || "";
        const episodes = $(el).find(".meta .dot:first-child").text().trim() || "";

        if (slug && slug !== slugOrId) {
          related.push({ title, slug, poster, url: href, relation: "trending", score, type, episodes });
        }
      });
    }

    return {
      animeId,
      slug: slugOrId,
      totalRelated: related.length,
      related,
    };
  } catch (error) {
    throw error;
  }
};

export { extractWatchOrder };
// ══════════════════════════════════════════════════════════════ END: watchOrder.extractor.js
