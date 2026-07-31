/*
 * ======= • ======= • ======= • ======= • =======• =======
 * AniKotoAPI — streamSegmentGuard.helper.js
 * Repository: https://github.com/Shineii86/AniKotoAPI
 *
 * @description
 *   Decides whether a URL referenced inside an M3U8 playlist is real
 *   video content or an ad-network creative that should be stripped —
 *   for domains in ALLOWED_STREAM_DOMAINS this is instant (trusted),
 *   for anything else it verifies via a baseline SSRF safety check
 *   plus a lightweight content probe rather than rejecting outright.
 *   See streamProxy.config.js for why a static domain allowlist alone
 *   isn't reliable here — segment CDNs rotate per provider/server, and
 *   verified real content has been observed on domains outside it.
 *
 * @exports
 *   classifySegments
 *
 * @author  Shinei Nouzen
 * @license MIT
 * ======= • ======= • ======= • ======= • =======• =======
 */

import axios from "axios";
import { headers } from "../configs/header.config.js";
import { isAllowedStreamUrl, isSafeExternalUrl, looksLikeVideoSegment } from "../configs/streamProxy.config.js";

const PROBE_TIMEOUT = 6000;
const PROBE_RANGE_BYTES = 4096;
const PROBE_CONCURRENCY = 8;

// ---- FEATURE: Single-URL real-content check ----
/**
 * @param {string} absoluteUrl
 * @param {object} options
 * @param {boolean} options.isNestedPlaylist - true if this URL is itself an .m3u8 (vs a media segment)
 * @param {string} options.refererOrigin - Referer/Origin to send (the embed page's own origin)
 * @returns {Promise<boolean>}
 */
const isRealStreamSegment = async (absoluteUrl, { isNestedPlaylist, refererOrigin }) => {
  if (isAllowedStreamUrl(absoluteUrl)) return true;
  if (!(await isSafeExternalUrl(absoluteUrl))) return false;

  try {
    if (isNestedPlaylist) {
      // NOTE: fetches the whole nested playlist rather than a partial
      // range — it's plain text and typically small, and the client will
      // request it again in full via our recursive /api/stream/proxy hop
      // regardless, so this is a one-time correctness check, not a hot path.
      const resp = await axios.get(absoluteUrl, {
        headers: { ...headers, Referer: `${refererOrigin}/`, Origin: refererOrigin },
        timeout: PROBE_TIMEOUT,
        responseType: "text",
      });
      return typeof resp.data === "string" && resp.data.trimStart().startsWith("#EXTM3U");
    }

    // NOTE: a small Range request is enough to sniff the container
    // signature without downloading the whole segment just to decide
    // whether to keep it — CDNs that ignore Range and return the full
    // body anyway still work fine here, we only look at the leading bytes.
    const resp = await axios.get(absoluteUrl, {
      headers: {
        ...headers,
        Referer: `${refererOrigin}/`,
        Origin: refererOrigin,
        Range: `bytes=0-${PROBE_RANGE_BYTES - 1}`,
      },
      timeout: PROBE_TIMEOUT,
      responseType: "arraybuffer",
      validateStatus: (status) => status === 200 || status === 206,
    });
    return looksLikeVideoSegment(Buffer.from(resp.data));
  } catch {
    return false;
  }
};

// ---- FEATURE: Concurrency-limited batch classification ----
/**
 * Classifies many playlist-referenced URLs in parallel (capped
 * concurrency) so a manifest with hundreds of non-allowlisted segments
 * doesn't serialize one probe request after another.
 *
 * @param {Array<{url: string, isNestedPlaylist: boolean, refererOrigin: string}>} entries
 * @returns {Promise<Map<string, boolean>>} url -> keep/drop decision
 */
const classifySegments = async (entries) => {
  const results = new Map();
  let cursor = 0;
  const worker = async () => {
    while (cursor < entries.length) {
      const entry = entries[cursor++];
      results.set(entry.url, await isRealStreamSegment(entry.url, entry));
    }
  };
  const workerCount = Math.min(PROBE_CONCURRENCY, entries.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
};

export { classifySegments, isRealStreamSegment };

// ══════════════════════════════════════════════════════════════ END: streamSegmentGuard.helper.js
