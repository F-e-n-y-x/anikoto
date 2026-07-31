/*
 * ======= • ======= • ======= • ======= • =======• =======
 * AniKotoAPI — streamProxy.config.js
 * Repository: https://github.com/Shineii86/AniKotoAPI
 *
 * @description
 *   Shared allowlist and validation for outbound requests made on
 *   behalf of a client (M3U8/TS proxy, stream quality resolution).
 *   Centralized here so every proxy endpoint enforces the same
 *   domain restriction and none of them can drift out of sync.
 *
 * @exports
 *   ALLOWED_STREAM_DOMAINS, isAllowedStreamUrl, isSafeExternalUrl,
 *   looksLikeVideoSegment, resolveRefererOrigin
 *
 * @author  Shinei Nouzen
 * @license MIT
 * ======= • ======= • ======= • ======= • =======• =======
 */

import dns from "dns";
import net from "net";

// ══════════════════════════════════════════════════════════════
// ALLOWED STREAM DOMAINS
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Known streaming CDN/server domains ----
/**
 * Hostnames the server is permitted to fetch on a client's behalf.
 * Any URL outside this allowlist is rejected before an outbound
 * request is made, preventing the proxy from being used as an
 * open SSRF relay.
 *
 * @type {string[]}
 */
// NOTE: g4stw.livedns.my is listed as an exact hostname, not a suffix
// entry — it's the actual segment CDN behind the mewstream.buzz/Vidstream
// provider (segments are real MPEG-TS data mislabeled with fake
// image/jpeg content-types and extensions, verified by checking the
// 0x47 MPEG-TS sync byte). livedns.my itself is a public dynamic-DNS
// domain, so allowlisting the whole parent would let anyone who
// registers a subdomain there point our proxy at an arbitrary host —
// only this one confirmed-legitimate subdomain is trusted.
const ALLOWED_STREAM_DOMAINS = ["vidtube.site", "vidplay.site", "megaplay.buzz", "kotocdn.site", "cdn.anipixcdn.co", "mewstream.buzz", "g4stw.livedns.my"];

// ---- FEATURE: Validate a URL against the stream domain allowlist ----
/**
 * Checks whether a URL's hostname is (or is a subdomain of) an
 * allowed streaming domain, and that its scheme is http/https.
 *
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL is safe to fetch server-side
 *
 * @example
 *   isAllowedStreamUrl("https://vidplay.site/foo.m3u8") // true
 *   isAllowedStreamUrl("http://169.254.169.254/") // false
 */
const isAllowedStreamUrl = (url) => {
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch {
    return false;
  }
  if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
    return false;
  }
  return ALLOWED_STREAM_DOMAINS.some((d) => urlObj.hostname === d || urlObj.hostname.endsWith(`.${d}`));
};

// ══════════════════════════════════════════════════════════════
// BASELINE SSRF GUARD (for domains outside the curated allowlist)
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Private/reserved IP range detection ----
// NOTE: Some legitimate segment CDNs (verified: real MPEG-TS video data,
// not ad content) rotate through domains we can't practically keep a
// static allowlist in sync with — see isRealStreamSegment in
// streamSegmentGuard.helper.js. Domains outside ALLOWED_STREAM_DOMAINS
// are still permitted through IF their content is verified as a real
// video segment, but that relaxation must never extend to fetching
// anything on a private/internal network — this is the gate that
// prevents that regardless of what the content-sniff finds.
const IPV4_PRIVATE_RANGES = [
  { base: [0, 0, 0, 0], bits: 8 },      // "this" network
  { base: [10, 0, 0, 0], bits: 8 },     // RFC1918
  { base: [100, 64, 0, 0], bits: 10 },  // CGNAT
  { base: [127, 0, 0, 0], bits: 8 },    // loopback
  { base: [169, 254, 0, 0], bits: 16 }, // link-local / cloud metadata (169.254.169.254)
  { base: [172, 16, 0, 0], bits: 12 },  // RFC1918
  { base: [192, 0, 0, 0], bits: 24 },   // IETF protocol assignments
  { base: [192, 168, 0, 0], bits: 16 }, // RFC1918
  { base: [198, 18, 0, 0], bits: 15 },  // benchmark
  { base: [224, 0, 0, 0], bits: 4 },    // multicast
  { base: [240, 0, 0, 0], bits: 4 },    // reserved
];

const ipv4ToInt = (parts) => parts.reduce((acc, p) => (acc << 8) + p, 0) >>> 0;

const isPrivateIPv4 = (ip) => {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true;
  const ipInt = ipv4ToInt(parts);
  return IPV4_PRIVATE_RANGES.some(({ base, bits }) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipInt & mask) === (ipv4ToInt(base) & mask);
  });
};

const isPrivateIPv6 = (ip) => {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  // fc00::/7 (unique local) and fe80::/10 (link-local)
  if (normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
};

const isPrivateIp = (ip) => {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateIPv4(ip);
  if (family === 6) return isPrivateIPv6(ip);
  return true; // not a recognizable literal IP — treat as unsafe
};

// ---- FEATURE: DNS-resolution-based private host check ----
/**
 * Resolves `hostname` and checks whether ANY resolved address falls in
 * a private/loopback/link-local/reserved range — blocks a public-looking
 * hostname from being used to reach an internal service or the cloud
 * metadata endpoint via DNS.
 *
 * @param {string} hostname
 * @returns {Promise<boolean>} true if the host is private/unsafe to fetch
 *
 * @note DNS is resolved once here, before the caller's actual HTTP
 * request. A DNS-rebinding attack timed between this check and the real
 * fetch could in theory still redirect the request — a fully IP-pinned
 * fetch (custom http(s) Agent) would close that gap but isn't implemented
 * here; this is a documented, accepted limitation, not an oversight.
 */
const isPrivateHostname = async (hostname) => {
  if (net.isIP(hostname)) return isPrivateIp(hostname);
  if (hostname === "localhost") return true;
  try {
    const records = await dns.promises.lookup(hostname, { all: true, verbatim: true });
    return records.some((r) => isPrivateIp(r.address));
  } catch {
    return true; // unresolvable — treat as unsafe rather than silently allow
  }
};

// ---- FEATURE: Baseline safety gate for any outbound proxy fetch ----
/**
 * Must pass for ANY URL this proxy fetches on a client's behalf,
 * regardless of ALLOWED_STREAM_DOMAINS status — checks scheme and that
 * the hostname doesn't resolve to a private/internal address.
 *
 * @param {string} url
 * @returns {Promise<boolean>}
 */
const isSafeExternalUrl = async (url) => {
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch {
    return false;
  }
  if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") return false;
  return !(await isPrivateHostname(urlObj.hostname));
};

// ══════════════════════════════════════════════════════════════
// CONTENT-SIGNATURE SNIFFING (real segment vs. ad creative)
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Video segment byte-signature check ----
/**
 * Checks whether a buffer contains a real video segment — MPEG-TS
 * (0x47 sync byte recurring every 188 bytes) or fMP4/CMAF (an ISO-BMFF
 * box whose type at offset 4-7 is "ftyp"/"styp"). Used to distinguish
 * real segments from ad-network creative content (images, HTML, JSON)
 * on domains outside ALLOWED_STREAM_DOMAINS.
 *
 * NOTE: some CDNs (verified live, both on our curated allowlist and
 * on domains outside it) prefix real MPEG-TS payloads with a small
 * fake-PNG wrapper (valid PNG signature/IHDR/IEND) to disguise segments
 * as images — the real TS sync stride starts a couple hundred bytes in,
 * not at offset 0. So this scans a window for the sync pattern rather
 * than requiring it at the very start of the buffer.
 *
 * @param {Buffer} buffer
 * @returns {boolean}
 */
const TS_PACKET_SIZE = 188;
const TS_SYNC_SCAN_WINDOW = 512; // covers the largest disguise-wrapper prefix observed (~252 bytes) with margin
const TS_SYNC_MIN_CONSECUTIVE = 5; // consecutive synced packets required to rule out a coincidental single 0x47 byte

const looksLikeVideoSegment = (buffer) => {
  if (!buffer || buffer.length < 8) return false;

  const boxType = buffer.toString("ascii", 4, 8);
  if (boxType === "ftyp" || boxType === "styp") return true;

  const scanLimit = Math.min(TS_SYNC_SCAN_WINDOW, buffer.length);
  for (let start = 0; start < scanLimit; start++) {
    if (buffer[start] !== 0x47) continue;
    const maxChecks = Math.floor((buffer.length - start) / TS_PACKET_SIZE) - 1;
    if (maxChecks < 1) continue;
    const checks = Math.min(TS_SYNC_MIN_CONSECUTIVE, maxChecks);
    let synced = true;
    for (let i = 1; i <= checks; i++) {
      if (buffer[start + i * TS_PACKET_SIZE] !== 0x47) { synced = false; break; }
    }
    if (synced) return true;
  }
  return false;
};

// ---- FEATURE: Resolve the Referer/Origin to send to a stream CDN ----
/**
 * Video CDNs behind these embeds check Referer against the embed page's
 * own domain (e.g. megaplay.buzz), not the parent anime site — so a
 * single hardcoded Referer doesn't work across providers. The client
 * knows the real embed origin (from /api/stream/resolve's `embedUrl`)
 * and can pass it through as `ref`; this falls back to the anime site's
 * own origin when `ref` is absent or malformed.
 *
 * @param {string} [ref] - A URL or origin string supplied by the client
 * @returns {string} A same-origin string safe to use as Referer/Origin
 */
const DEFAULT_REFERER_ORIGIN = "https://anikototv.to";
const resolveRefererOrigin = (ref) => {
  if (!ref) return DEFAULT_REFERER_ORIGIN;
  try {
    return new URL(ref).origin;
  } catch {
    return DEFAULT_REFERER_ORIGIN;
  }
};

export { ALLOWED_STREAM_DOMAINS, isAllowedStreamUrl, isSafeExternalUrl, looksLikeVideoSegment, resolveRefererOrigin };
// ══════════════════════════════════════════════════════════════ END: streamProxy.config.js
