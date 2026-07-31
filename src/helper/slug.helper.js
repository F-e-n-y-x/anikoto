/*
 * ======= • ======= • ======= • ======= • =======• =======
 * AniKotoAPI — slug.helper.js
 * Repository: https://github.com/Shineii86/AniKotoAPI
 *
 * @description
 *   Shared helper for extracting a clean anime slug from a /watch/ href.
 *   List/carousel items often link straight to an episode
 *   (e.g. /watch/one-piece-odmau/ep-1150), so naively taking everything
 *   after "/watch/" leaves the episode suffix attached to the slug —
 *   breaking any endpoint that expects a bare anime slug (/api/info,
 *   /api/episodes, etc).
 *
 * @exports
 *   extractSlug
 *
 * @author  Shinei Nouzen
 * @license MIT
 * ======= • ======= • ======= • ======= • =======• =======
 */

// ══════════════════════════════════════════════════════════════
// SLUG EXTRACTION
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Extract a bare anime slug from a /watch/ href ----
/**
 * @param {string} href - A href/URL containing "/watch/{slug}" or "/watch/{slug}/ep-{n}"
 * @returns {string} The bare anime slug, or "" if href has no /watch/ segment
 *
 * @example
 *   extractSlug("/watch/one-piece-odmau/ep-1150") // "one-piece-odmau"
 *   extractSlug("/watch/one-piece-odmau")          // "one-piece-odmau"
 */
const extractSlug = (href) => {
  if (!href) return "";
  const after = href.split("/watch/").pop();
  if (!after) return "";
  return after.split("/")[0].split("?")[0].split("#")[0];
};

export { extractSlug };

// ══════════════════════════════════════════════════════════════ END: slug.helper.js
