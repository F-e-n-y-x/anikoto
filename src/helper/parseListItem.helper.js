/*
 * ======= • ======= • ======= • ======= • =======• =======
 * AniKotoAPI — parseListItem.helper.js
 * Repository: https://github.com/Shineii86/AniKotoAPI
 *
 * @description
 *   Shared helper for parsing anime list items from Cheerio DOM.
 *   Eliminates code duplication across multiple extractors by
 *   providing a unified parsing function for standard list items.
 *
 * @exports
 *   parseListItems, parseListItem
 *
 * @author  Shinei Nouzen
 * @license MIT
 * ======= • ======= • ======= • ======= • =======• =======
 */

import { extractSlug } from "./slug.helper.js";

// ══════════════════════════════════════════════════════════════
// SINGLE ITEM PARSER
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Parse a single anime list item from a Cheerio element ----
/**
 * Parses a single anime list item from a Cheerio element.
 * Handles multiple CSS selector patterns for different page layouts
 * by falling through comma-separated selectors until one matches.
 *
 * @param {CheerioAPI} $ - Cheerio instance with loaded HTML
 * @param {CheerioElement} el - DOM element to parse
 * @param {object} [options] - Parsing options
 * @param {boolean} [options.includeAnimeId=false] - Include animeId field from data-tip attribute
 * @param {boolean} [options.includeRating=true] - Include rating field from .rated span
 * @returns {object|null} Parsed anime object or null if slug is missing (invalid item)
 *
 * @example
 *   const item = parseListItem($, el, { includeAnimeId: true });
 *   if (item) results.push(item);
 */
const parseListItem = ($, el, options = {}) => {
  const { includeAnimeId = false, includeRating = true } = options;

  // NOTE: slug is the primary key — skip items without a valid watch link
  // NOTE: item may BE the <a> tag itself, so check both self and children
  let slug = "";
  if ($(el).is("a")) {
    slug = extractSlug($(el).attr("href"));
  }
  if (!slug) {
    slug = extractSlug($(el).find("a").attr("href"));
  }
  if (!slug) return null;

  // NOTE: Multiple selectors handle different page layouts (#list-items vs .film_list-wrap vs .item)
  const poster = $(el).find("img").attr("src") || "";
  const title = $(el).find(".name").text().trim() || $(el).children(".info").find(".name").text().trim() || "";
  const japaneseTitle = $(el).find(".name").attr("data-jp") || "";
  const sub = parseInt($(el).find(".ep-status.sub span").text().trim()) || 0;
  const dub = parseInt($(el).find(".ep-status.dub span").text().trim()) || 0;
  const total = parseInt($(el).find(".ep-status.total span").text().trim()) || 0;
  const type = $(el).find(".meta .dot:last-child, .fdi-item:nth-child(2)").text().trim() || "";

  const item = { slug, poster, title, japaneseTitle, sub, dub, total, type };

  // NOTE: animeId comes from data-tip on .ani.poster.tip — only present on some page layouts
  if (includeAnimeId) {
    item.animeId = $(el).find(".ani.poster.tip").attr("data-tip") || "";
  }

  // NOTE: Rating uses different selectors depending on whether it's a list page or detail page
  if (includeRating) {
    item.rating = $(el).find(".rated span, .rating, .fdi-item:nth-child(3)").text().trim() || "";
  }

  return item;
};

// ══════════════════════════════════════════════════════════════
// MULTI-ITEM PARSER
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Parse multiple anime list items from a Cheerio instance ----
/**
 * Parses multiple anime list items from a Cheerio instance.
 * Uses multiple CSS selectors to handle different page layouts,
 * returning only items with valid slugs.
 *
 * @param {CheerioAPI} $ - Cheerio instance with loaded HTML
 * @param {string} [selector] - CSS selector for list items (default: auto-detect all layouts)
 * @param {object} [options] - Parsing options (passed to parseListItem)
 * @returns {Array<object>} Array of parsed anime objects (empty if none found)
 *
 * @example
 *   const $ = await extractPages("/most-popular");
 *   const items = parseListItems($);
 *   console.log(items.length); // Number of parsed items
 */
// NOTE: When no explicit selector is given, these candidates are tried IN
// ORDER — the first one that matches ANY items wins, and the rest are
// never consulted. They are NOT combined into one comma-separated CSS
// query: a page's real paginated list lives at "#list-items > .item",
// but some pages also render an unrelated static sidebar/recommendation
// widget whose items also carry a bare ".item" class (verified live on
// /latest-updated: a "scaff side items md" sidebar sits alongside the
// real "#list-items" list, contributing the same ~10 items to every
// page). Combining all candidates into one query — as this used to do —
// silently mixed that sidebar's items into every single page of "real"
// paginated results, since the sidebar isn't paginated and renders
// identically regardless of ?page=. Trying "#list-items > .item" first
// and stopping there whenever it finds anything keeps the broader
// candidates as a genuine last resort for page layouts that don't have
// "#list-items" at all.
const DEFAULT_LIST_ITEM_SELECTORS = ["#list-items > .item", ".film_list-wrap .flw-item", ".film-detail", ".item"];

const parseListItems = ($, selector, options = {}) => {
  const candidates = selector ? [selector] : DEFAULT_LIST_ITEM_SELECTORS;

  for (const candidate of candidates) {
    const results = [];
    $(candidate).each((i, el) => {
      const item = parseListItem($, el, options);
      if (item) results.push(item);
    });
    if (results.length > 0) return results;
  }

  return [];
};

export { parseListItems, parseListItem };

// ══════════════════════════════════════════════════════════════ END: parseListItem.helper.js
