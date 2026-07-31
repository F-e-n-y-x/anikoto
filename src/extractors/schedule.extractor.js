/*
 * ======= • ======= • ======= • ======= • =======• =======
 * AniKotoAPI — schedule.extractor.js
 * Repository: https://github.com/Shineii86/AniKotoAPI
 *
 * @description
 *   Extracts anime schedule for a specific date.
 *   Returns airing times and episode numbers for scheduled anime.
 *
 * @exports
 *   extractSchedule
 *
 * @author  Shinei Nouzen
 * @license MIT
 * ======= • ======= • ======= • ======= • =======• =======
 */

import * as cheerio from "cheerio";
import { headers } from "../configs/header.config.js";
import { fetchWithMirror } from "../helper/mirror.helper.js";
import { extractSlug } from "../helper/slug.helper.js";

// ══════════════════════════════════════════════════════════════
// SCHEDULE EXTRACTION
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Extract anime schedule for a specific date ----
/**
 * Fetches and parses the anime schedule for a given date.
 * Returns airing times and episode numbers for scheduled anime.
 *
 * @param {string} date - Date to fetch schedule for (format: YYYY-MM-DD)
 * @returns {Promise<Array<Object>>} Array of scheduled anime objects
 * @returns {string} return.slug - URL slug for the anime
 * @returns {string} return.title - Anime title
 * @returns {string} return.time - Airing time
 * @returns {number} return.episode_no - Episode number
 *
 * @example
 *   const schedule = await extractSchedule("2024-01-15");
 *   console.log(schedule[0].time); // Airing time
 *   console.log(schedule[0].episode_no); // Episode number
 */
const extractSchedule = async (date) => {
  try {
    // NOTE: The site's schedule widget is entirely client-rendered — the
    // homepage only ships an empty `<div id="schedule-block">`, populated
    // via `ajax/schedule/date?tz=<hours>&time=<unix-seconds-UTC-midnight>`.
    // A plain `/?date=YYYY-MM-DD` request (the old approach here) just
    // returns the ordinary homepage with no schedule data at all. We fix
    // tz=0 so `time` is deterministic (UTC midnight for the given date),
    // matching how the frontend computes its own "today" in UTC.
    const [year, month, day] = date.split("-").map(Number);
    const timeSeconds = Math.floor(Date.UTC(year, month - 1, day) / 1000);
    const path = `/ajax/schedule/date?tz=0&time=${timeSeconds}`;

    const { data: raw } = await fetchWithMirror(path, {
      headers: {
        ...headers,
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    // NOTE: Response is JSON {status, result} where result is an HTML
    // fragment (`<div class="items">...</div>`), not a full document.
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const html = parsed?.result || "";
    const $ = cheerio.load(html);

    const schedule = [];

    $(".items > a.item").each((i, el) => {
      const slug = extractSlug($(el).attr("href"));
      const title = $(el).find(".title.d-title, .title").text().trim() || "";
      const time = $(el).find(".time").text().trim() || "";
      const episodeMatch = $(el).find(".ep span").text().match(/\d+/);
      const episodeNo = episodeMatch ? parseInt(episodeMatch[0]) : 0;

      if (slug) {
        schedule.push({
          slug,
          title,
          time,
          episode_no: episodeNo
        });
      }
    });

    return schedule;
  } catch (error) {
    throw error;
  }
};

export { extractSchedule };

// ══════════════════════════════════════════════════════════════ END: schedule.extractor.js
