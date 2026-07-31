/**
 * ============================================================================
 *  AniKotoAPI — Architecture Document
 *  Version : 2.3.0
 *  Generated: 2026-07-31
 * ============================================================================
 *
 *  One Node process serving three things: a REST API, a full Next.js
 *  website, and a standalone vanilla-JS browsing/player app — all on one
 *  port. Free REST API for scraping anime data from anikototv.to.
 *  Tech Stack: Node.js (ESM) · Express 4.21 · Cheerio 1.0 · Axios 1.8
 *              compression 1.8 · http-proxy-middleware 4.2 · hand-rolled
 *              LRU cache · Next.js 15 / React 19 (frontend/)
 *
 *  Table of Contents
 *  ──────────────────────────────────────────────────────────────────────────
 *  1.  High-Level Architecture
 *  2.  Request Flow
 *  3.  Directory Layout
 *  4.  Component Responsibilities
 *  5.  Data Flow
 *  6.  Mirror Failover Strategy
 *  7.  Caching Strategy
 *  8.  Rate Limiting & Compression
 *  9.  Error Handling Strategy
 *  10. Security Considerations
 *  11. Deployment
 *  12. Testing Strategy
 *  13. Versioning & Changelog Notes
 * ============================================================================
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1 — HIGH-LEVEL ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A single Express process (server.js) is the entry point for everything.
 * On startup it registers the API routes directly, then — if a frontend/
 * checkout is present — spawns a full Next.js app as an internal child
 * process and reverse-proxies all non-API traffic to it. A separate,
 * dependency-free vanilla-JS app is served statically at /web. There is no
 * database; Cheerio parses HTML scraped live from anikototv.to on cache miss.
 *
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │                        CLIENT (Browser / App)                       │
 *  └──────────────────────────┬──────────────────────────────────────────┘
 *                             │  HTTP(S)
 *                             ▼
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │                   server.js  (Express App, one port)                │
 *  │                                                                     │
 *  │  ┌─────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────────┐ │
 *  │  │   CORS   │  │Compression │  │ Rate Limiter │  │ Security       │ │
 *  │  │(custom mw)│ │ (gzip)     │  │ (300/min/IP) │  │ Headers (CSP…) │ │
 *  │  └─────────┘  └────────────┘  └──────────────┘  └────────────────┘ │
 *  │                                                                     │
 *  │  Routes by path, three ways:                                       │
 *  │                                                                     │
 *  │  ┌──────────────┐   ┌──────────────────┐   ┌───────────────────┐  │
 *  │  │  /api/*      │   │  /web/*          │   │  everything else  │  │
 *  │  │              │   │                  │   │                   │  │
 *  │  │  ▼           │   │  ▼               │   │  ▼                │  │
 *  │  │ ROUTING      │   │ express.static   │   │ http-proxy-       │  │
 *  │  │ apiRoutes.js │   │ (public/web/)    │   │ middleware →       │  │
 *  │  │ category     │   │ standalone       │   │ internal Next.js   │  │
 *  │  │ .route.js    │   │ vanilla JS app   │   │ child process      │  │
 *  │  │  │           │   │ + HLS player     │   │ (frontend/,        │  │
 *  │  │  ▼           │   └──────────────────┘   │  NEXT_INTERNAL_PORT)│  │
 *  │  │ CONTROLLERS  │                           │  fetches the same   │  │
 *  │  │ (27 files)   │                           │  /api/* internally  │  │
 *  │  │  │           │                           └───────────────────┘  │
 *  │  │  ▼           │                                                   │
 *  │  │ EXTRACTORS   │                                                   │
 *  │  │ (27 files)   │                                                   │
 *  │  │  │           │                                                   │
 *  │  │  ▼           │                                                   │
 *  │  │ HELPERS +    │                                                   │
 *  │  │ CONFIGS      │                                                   │
 *  │  └──────────────┘                                                   │
 *  └─────────────────────────────────────────────────────────────────────┘
 *                             │
 *                             ▼  HTTP / HTTPS
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │              MIRROR POOL  (5 domains, auto-failover)                │
 *  │                                                                     │
 *  │  1. anikototv.to   (Primary)                                        │
 *  │  2. anikoto.cz     (Regional CZ)                                    │
 *  │  3. anikoto.me     (Short TLD)                                      │
 *  │  4. anikoto.net    (Network)                                        │
 *  │  5. anikototv.se   (Nordic .se)                                     │
 *  └─────────────────────────────────────────────────────────────────────┘
 *
 *  If frontend/ isn't present (e.g. a minimal API-only checkout), server.js
 *  logs a notice and runs in API-only mode automatically — no config needed
 *  either way. The reverse-proxy branch and the Next.js child simply never
 *  start.
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 — REQUEST FLOW
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Every inbound request passes through the following pipeline:
 *
 *   Client
 *     │
 *     ▼
 *   ┌──────────────────────────────┐
 *   │  1.  Compression Middleware  │  ◄── gzip (threshold: 1KB)
 *   └──────────────┬───────────────┘
 *                  ▼
 *   ┌──────────────────────────────┐
 *   │  2.  Request ID + CORS       │  ◄── X-Request-Id header, allow/block origins
 *   └──────────────┬───────────────┘
 *                  ▼
 *   ┌──────────────────────────────┐
 *   │  3.  Security Headers        │  ◄── CSP, HSTS, X-Frame-Options, etc.
 *   └──────────────┬───────────────┘
 *                  ▼
 *   ┌──────────────────────────────┐
 *   │  4.  Static Files (/web,     │  ◄── express.static, serves and returns early
 *   │       /tos, /privacy)        │       if matched
 *   └──────────────┬───────────────┘
 *                  ▼
 *   ┌──────────────────────────────┐
 *   │  5.  Rate Limiter            │  ◄── 300 req/min/IP, /api/* only (429 on exceed)
 *   └──────────────┬───────────────┘
 *                  ▼
 *   ┌──────────────────────────────┐
 *   │  6.  Request Timeout         │  ◄── 30s default, configurable
 *   └──────────────┬───────────────┘
 *                  ▼
 *          ┌───────┴────────┐
 *          ▼                ▼
 *   ┌─────────────┐   ┌──────────────────────────┐
 *   │  /api/* ?   │   │  everything else          │
 *   └──────┬──────┘   │  → reverse-proxied to the │
 *          ▼          │    internal Next.js child │
 *   (API path below)  └──────────────────────────┘
 *          │
 *          ▼
 *   ┌──────────────────────────────┐
 *   │  7.  Route Matching          │  ◄── apiRoutes.js / category.route.js
 *   └──────────────┬───────────────┘
 *                  ▼
 *   ┌──────────────────────────────┐
 *   │  8.  Controller              │  ◄── Validate params, call extractor
 *   └──────────────┬───────────────┘
 *                  ▼
 *   ┌──────────────────────────────┐
 *   │  9.  Cache Lookup            │  ◄── LRU hit? → Return cached data
 *   │       (if miss)              │
 *   └──────────────┬───────────────┘
 *                  ▼
 *   ┌──────────────────────────────┐
 *   │  10. Mirror Selection        │  ◄── mirror.helper.js (cached-mirror-first + fallback)
 *   └──────────────┬───────────────┘
 *                  ▼
 *   ┌──────────────────────────────┐
 *   │  11. HTTP Fetch (Axios)      │  ◄── Request source HTML from mirror
 *   └──────────────┬───────────────┘
 *                  ▼
 *   ┌──────────────────────────────┐
 *   │  12. HTML Parse (Cheerio)    │  ◄── Extractor scrapes structured data
 *   └──────────────┬───────────────┘
 *                  ▼
 *   ┌──────────────────────────────┐
 *   │  13. Cache Store             │  ◄── Write to LRU with endpoint TTL
 *   └──────────────┬───────────────┘
 *                  ▼
 *   ┌──────────────────────────────┐
 *   │  14. JSON Response           │  ◄── Express res.json()
 *   └──────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3 — DIRECTORY LAYOUT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AniKotoAPI/
 * ├── server.js                      # Express entry point: middleware chain,
 * │                                  #   frontend spawn + reverse proxy, /web
 * │                                  #   static serving, graceful shutdown
 * ├── package.json                   # Backend dependencies & npm scripts
 * ├── frontend/                      # Next.js 15 / React 19 app — spawned as
 * │   │                              #   a child process by server.js, never
 * │   │                              #   run standalone in production
 * │   ├── src/                       # App Router pages, components, lib
 * │   └── package.json               # Its own dependency tree
 * ├── public/                        # Static files served directly by Express
 * │   ├── index.html, 404.html, tos.html, privacy.html, manifest.json, ...
 * │   └── web/                       # Standalone browsing + player app
 * │       ├── index.html             #   The whole app — no build step
 * │       ├── api-tester/            #   Raw endpoint tester (/web/api-tester)
 * │       └── vendor/                #   Self-hosted fonts + hls.js
 * ├── docs/                          # Documentation (you are here)
 * │   ├── index.md
 * │   ├── endpoints.md
 * │   ├── streaming.md
 * │   ├── examples.md
 * │   ├── architecture.md
 * │   └── testing.md
 * ├── src/
 * │   ├── configs/
 * │   │   ├── dataUrl.js              # URL patterns for anikototv.to + mirrors
 * │   │   ├── header.config.js        # Default HTTP headers for upstream requests
 * │   │   ├── ids.config.js           # Genre / Type / Status / Source / Season ID mappings
 * │   │   └── streamProxy.config.js   # Stream domain allowlist + SSRF guard +
 * │   │                              #   content-signature sniffing
 * │   ├── controllers/                # 27 route handlers (one per endpoint group)
 * │   │   ├── homeInfo.controller.js
 * │   │   ├── animeInfo.controller.js
 * │   │   ├── search.controller.js
 * │   │   ├── episodeList.controller.js
 * │   │   ├── episodeListAjax.controller.js
 * │   │   ├── streamInfo.controller.js
 * │   │   ├── streamResolver.controller.js
 * │   │   ├── schedule.controller.js
 * │   │   ├── spotlight.controller.js
 * │   │   ├── trending.controller.js
 * │   │   ├── topten.controller.js
 * │   │   ├── suggestion.controller.js
 * │   │   ├── random.controller.js
 * │   │   ├── popular.controller.js
 * │   │   ├── filter.controller.js
 * │   │   ├── watchPage.controller.js
 * │   │   ├── azList.controller.js
 * │   │   ├── newRelease.controller.js
 * │   │   ├── trendingSidebar.controller.js
 * │   │   ├── seasons.controller.js
 * │   │   ├── watchOrder.controller.js
 * │   │   ├── download.controller.js
 * │   │   ├── upcomingAnime.controller.js
 * │   │   ├── topAnimeRankings.controller.js
 * │   │   ├── recentlyUpdatedTabs.controller.js
 * │   │   ├── completedAnime.controller.js
 * │   │   └── category.controller.js  # Also serves genre/type/status (no
 * │   │                              #   separate status controller exists)
 * │   ├── extractors/                 # 27 HTML scrapers (one per data source)
 * │   │   ├── homeInfo.extractor.js
 * │   │   ├── animeInfo.extractor.js
 * │   │   ├── search.extractor.js
 * │   │   ├── episodeList.extractor.js
 * │   │   ├── episodeListAjax.extractor.js
 * │   │   ├── streamInfo.extractor.js
 * │   │   ├── streamResolver.extractor.js
 * │   │   ├── schedule.extractor.js
 * │   │   ├── spotlight.extractor.js
 * │   │   ├── trending.extractor.js
 * │   │   ├── topten.extractor.js
 * │   │   ├── suggestion.extractor.js
 * │   │   ├── random.extractor.js
 * │   │   ├── popular.extractor.js
 * │   │   ├── filter.extractor.js
 * │   │   ├── watchPage.extractor.js
 * │   │   ├── azList.extractor.js
 * │   │   ├── newRelease.extractor.js
 * │   │   ├── trendingSidebar.extractor.js
 * │   │   ├── seasons.extractor.js
 * │   │   ├── watchOrder.extractor.js
 * │   │   ├── download.extractor.js
 * │   │   ├── upcomingAnime.extractor.js
 * │   │   ├── topAnimeRankings.extractor.js
 * │   │   ├── recentlyUpdatedTabs.extractor.js
 * │   │   ├── completedAnime.extractor.js
 * │   │   └── category.extractor.js
 * │   ├── helper/
 * │   │   ├── cache.helper.js         # Hand-rolled LRU cache with per-endpoint TTL
 * │   │   ├── countPages.helper.js    # Pagination page-count parser
 * │   │   ├── extractPages.helper.js  # Paginated-page HTTP fetcher
 * │   │   ├── mirror.helper.js        # Multi-mirror failover (5 domains)
 * │   │   ├── parseListItem.helper.js # Shared list-item DOM parser
 * │   │   ├── pagination.helper.js    # Pagination metadata builder
 * │   │   ├── slug.helper.js          # Slug extraction from hrefs
 * │   │   └── streamSegmentGuard.helper.js # Content-signature validation for
 * │   │                              #   stream segments outside the allowlist
 * │   └── routes/
 * │       ├── apiRoutes.js            # All route definitions + M3U8/TS proxy +
 * │       │                          #   OpenAPI spec
 * │       └── category.route.js       # Genre / Type / Status sub-routes
 * ├── Dockerfile                      # Builds backend + frontend together
 * ├── render.yaml                     # Render deployment config (same build)
 * ├── vercel.json                     # Vercel config — API-only, see Section 11
 * ├── agents/                         # Reference/planning docs for AI agent
 * │   │                              #   personas working on this repo (not
 * │   │                              #   invocable subagents themselves)
 * │   ├── api-tester.md
 * │   ├── backend-architect.md
 * │   ├── devops-automator.md
 * │   ├── performance-benchmarker.md
 * │   ├── security-architect.md
 * │   └── technical-writer.md
 * └── test.js                         # Live-network smoke test (see Section 12)
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4 — COMPONENT RESPONSIBILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  server.js                                                            │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │  • Creates the Express application instance (ESM)                     │
 * │  • Registers global middleware: compression, request ID, CORS,        │
 * │    security headers, JSON body parser (10kb limit)                    │
 * │  • Serves /web, /tos, /privacy statically; mounts /api/* routes       │
 * │  • Applies rate limiting (300 req/min/IP, /api/* only) and a 30s      │
 * │    request timeout                                                    │
 * │  • Spawns frontend/ as a child process (if present) and reverse-      │
 * │    proxies everything else to it via http-proxy-middleware            │
 * │  • Handles graceful shutdown (SIGTERM/SIGINT) and uncaught exceptions │
 * │  • Handles 404 fallback for unmatched routes when no frontend exists  │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  frontend/  (Next.js, spawned child process)                          │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │  • A full Next.js 15 App Router site — home, discover, search, anime  │
 * │    detail, watch pages, schedule                                       │
 * │  • Listens on an internal-only port (NEXT_INTERNAL_PORT, default      │
 * │    4001) — never exposed directly, only reached through the reverse   │
 * │    proxy in server.js                                                  │
 * │  • Server-rendered pages fetch the same /api/* endpoints internally,  │
 * │    via API_INTERNAL_BASE (set automatically by server.js)             │
 * │  • Not compatible with Vercel serverless — see Section 11             │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  public/web/  (standalone player, static files)                       │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │  • One self-contained HTML file — no framework, no build step         │
 * │  • Its own search, browsing, anime detail, and a custom HLS player    │
 * │    (quality switching, skip intro/outro, keyboard shortcuts)          │
 * │  • Watch history / continue-watching tracked in localStorage          │
 * │  • Served with explicit Cache-Control: no-cache so fixes are never    │
 * │    stuck behind a stale cached copy                                    │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  Controllers  (27 files)                                              │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │  Responsibilities:                                                     │
 * │  • Extract and validate request parameters (query, params, body)      │
 * │  • Invoke the corresponding extractor function                        │
 * │  • Wrap result in a standard JSON envelope { success, results }        │
 * │  • Catch errors and forward to Express's error handler via next(err)  │
 * │  • No direct HTTP fetching — all scraping lives in extractors         │
 * │  • category.controller.js also serves genre/type/status filtering —   │
 * │    there is no separate status.controller.js (a dead, unreachable     │
 * │    copy of one existed until 2026-07-31 and was removed)               │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  Extractors  (27 scrapers)                                            │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │  One extractor per data source on the target site. Responsibilities:  │
 * │  • Build the upstream URL (via mirror.helper / dataUrl.js)             │
 * │  • Fetch raw HTML using Axios (via fetchWithMirror) with configured   │
 * │    headers                                                             │
 * │  • Parse HTML with Cheerio and extract structured data                │
 * │  • Return normalized JavaScript objects ready for JSON serialization   │
 * │  • No Express coupling — pure data extraction                         │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  Helpers                                                              │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │  cache.helper.js                                                      │
 * │    • Hand-rolled LRU Cache (Map-based, no external deps)               │
 * │    • Provides get/set/delete/clear with per-endpoint TTL              │
 * │    • TTLs range from 3 min (stream) to 60 min (genres)                │
 * │    • Cache key = endpoint-specific string built by each controller     │
 * │                                                                       │
 * │  mirror.helper.js                                                     │
 * │    • Maintains ordered list of 5 mirror domains                       │
 * │    • Tries the cached last-known-working mirror first                 │
 * │    • Automatic failover on connection error (not on a real 404)       │
 * │    • Caches successful mirror for 1 hour                              │
 * │                                                                       │
 * │  pagination.helper.js / countPages.helper.js / extractPages.helper.js │
 * │    • Build pagination metadata and fetch paginated upstream pages     │
 * │                                                                       │
 * │  parseListItem.helper.js                                              │
 * │    • Shared logic for parsing repeated list-item DOM structures       │
 * │    • Tries selector candidates in priority order (first non-empty     │
 * │      match wins) rather than combining them into one broad query —    │
 * │      the broad-query version used to leak an unrelated homepage       │
 * │      sidebar widget's items into paginated results (fixed 2026-07-31) │
 * │                                                                       │
 * │  streamSegmentGuard.helper.js                                         │
 * │    • Classifies M3U8-referenced segments from domains outside the     │
 * │      curated allowlist as real video vs. ad content, by content       │
 * │      signature (MPEG-TS/fMP4) rather than domain alone — see          │
 * │      Section 10                                                       │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  Configs                                                              │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │  header.config.js — Default User-Agent, Accept, Accept-Language       │
 * │  ids.config.js — Genre / Type / Status / Source / Season ID mappings   │
 * │  dataUrl.js — Base URL + upstream URL builders                        │
 * │  streamProxy.config.js — ALLOWED_STREAM_DOMAINS allowlist,             │
 * │    isSafeExternalUrl() (DNS-resolved private-IP/SSRF guard),           │
 * │    looksLikeVideoSegment() (MPEG-TS/fMP4 byte-signature check)         │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  Routes                                                               │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │  apiRoutes.js                                                         │
 * │    • Defines all top-level endpoint paths with HTTP methods           │
 * │    • Maps paths to controller functions                                │
 * │    • Also implements the M3U8/TS stream proxy inline (not a           │
 * │      controller — see streaming.md)                                   │
 * │    • Embeds OpenAPI 3.0 spec (version read live from package.json)     │
 * │                                                                       │
 * │  category.route.js                                                    │
 * │    • Sub-router for /api/genre, /api/type, /api/status                │
 * │    • All three delegate to the same category.controller.js            │
 * └────────────────────────────────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5 — DATA FLOW
// ═══════════════════════════════════════════════════════════════════════════

/**
 * For an /api/* request, the data flow is strictly unidirectional:
 *
 *   External Site (anikototv.to, via mirror pool)
 *          │
 *          │  Raw HTML
 *          ▼
 *   ┌──────────────┐
 *   │   Axios       │  HTTP GET with browser-like headers, via fetchWithMirror
 *   └──────┬───────┘
 *          │
 *          ▼
 *   ┌──────────────┐
 *   │   Cheerio     │  DOM traversal & data extraction
 *   └──────┬───────┘
 *          │
 *          │  Structured JS objects
 *          ▼
 *   ┌──────────────┐
 *   │   Extractor   │  Normalizes data shapes across endpoints
 *   └──────┬───────┘
 *          │
 *          ▼
 *   ┌──────────────┐
 *   │   Controller  │  Wraps in { success, results } envelope
 *   └──────┬───────┘
 *          │
 *          ▼
 *   ┌──────────────┐
 *   │   LRU Cache   │  Stores for endpoint-specific TTL
 *   └──────┬───────┘
 *          │
 *          │  JSON
 *          ▼
 *   ┌──────────────┐
 *   │   Express     │  GZIP compression + CORS headers
 *   └──────┬───────┘
 *          │
 *          ▼
 *        Client
 *
 *  For a frontend (/) request, server-rendered pages on the Next.js side
 *  make their own internal HTTP calls back into this same /api/* pipeline
 *  (via API_INTERNAL_BASE) — there is no separate data-access layer.
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6 — MIRROR FAILOVER STRATEGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The API scrapes from a network of 5 mirror domains, all serving the same
 * content. mirror.helper.js manages automatic failover:
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │                     MIRROR DOMAINS                                   │
 *  ├──────┬──────────────────┬──────────────┬────────────────────────────┤
 *  │  #   │  Domain          │  Role        │  Notes                     │
 *  ├──────┼──────────────────┼──────────────┼────────────────────────────┤
 *  │  1   │  anikototv.to    │  Primary     │  Default fallback          │
 *  │  2   │  anikoto.cz      │  Regional    │  Central Europe            │
 *  │  3   │  anikoto.me      │  Short TLD   │  Compact URL                │
 *  │  4   │  anikoto.net     │  Network     │  Alternative DNS           │
 *  │  5   │  anikototv.se    │  Nordic      │  Sweden / Nordic region     │
 *  └──────┴──────────────────┴──────────────┴────────────────────────────┘
 *
 *  Failover Algorithm (fetchWithMirror):
 *
 *    1.  Try the cached last-known-working mirror first, if any.
 *    2.  Otherwise try mirrors in priority order.
 *    3.  Attempt HTTP GET via Axios (default 15s timeout, up to 2 retries
 *        with backoff per mirror on connection errors — NOT on a real 404).
 *    4.  On success (2xx):
 *          • Cache the successful mirror domain (TTL: 1 hour, configurable
 *            via MIRROR_CACHE_TTL).
 *          • Return HTML to the caller.
 *    5.  On a genuine 404 (endpoint doesn't exist on this mirror):
 *          • Do NOT mark the mirror as failed — move to the next mirror
 *            without penalizing it.
 *    6.  On connection failure:
 *          • Mark the mirror as failed and move to the next one.
 *    7.  If all mirrors fail:
 *          • Throw an error propagated to the controller, which forwards
 *            it to Express's error handler via next(error).
 *
 *  Notes:
 *    • random.extractor.js is routed through fetchWithMirror() like every
 *      other extractor (it used to bypass mirror fallback entirely — fixed
 *      2026-07-31); fetchWithMirror() also returns the final redirect URL
 *      so callers that need it (like the random-anime redirect chain)
 *      don't need their own axios call.
 *    • All mirrors share the same origin content; no consistency risk.
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7 — CACHING STRATEGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * An in-memory LRU (Least Recently Used) cache sits between controllers
 * and extractors, eliminating redundant upstream requests. It's a small
 * hand-rolled Map-based implementation (src/helper/cache.helper.js) — no
 * external cache library.
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │                    CACHE TTL MATRIX (TTL object in cache.helper.js)  │
 *  ├──────────────────────────────┬───────────────────────────────────────┤
 *  │  Endpoint Category           │  TTL                                 │
 *  ├──────────────────────────────┼───────────────────────────────────────┤
 *  │  home                        │  10 minutes                          │
 *  │  search                      │  5 minutes                           │
 *  │  info                        │  10 minutes                          │
 *  │  episodes                    │  5 minutes                           │
 *  │  servers                     │  10 minutes                          │
 *  │  stream                      │  3 minutes                           │
 *  │  spotlight / trending        │  10 minutes                          │
 *  │  schedule                    │  30 minutes                          │
 *  │  genres                      │  60 minutes                          │
 *  │  suggestions                 │  5 minutes                           │
 *  │  default (unlisted)          │  5 minutes                           │
 *  └──────────────────────────────┴───────────────────────────────────────┘
 *
 *  LRU Configuration:
 *    • Max entries: 200 (configurable via CACHE_MAX_SIZE), evicts the
 *      oldest entry when full.
 *    • Eviction:   TTL-based (lazy, checked on access) + size-based (LRU).
 *    • Storage:    JavaScript Map (in-process memory).
 *    • Persistence: None (lost on restart; acceptable for a scraping API).
 *
 *  Cache Flow:
 *
 *    Controller
 *       │
 *       ▼
 *    getCache(key)
 *       │
 *       ├── HIT  → return cached data (no extractor call)
 *       │
 *       └── MISS → call extractor
 *                      │
 *                      ▼
 *                  setCache(key, data, ttl)
 *                      │
 *                      ▼
 *                  return data
 *
 *  Thread Safety:
 *    Node.js is single-threaded per event loop tick. Map operations
 *    (get/set/delete) are atomic. No locking required.
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8 — RATE LIMITING & COMPRESSION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  RATE LIMITING                                                       │
 * ├──────────────────────────────────────────────────────────────────────┤
 * │                                                                      │
 * │  • Algorithm: Sliding window counter (per IP)                        │
 * │  • Limit:     300 requests per 60-second window (RATE_LIMIT /        │
 * │               RATE_WINDOW env vars) — raised from 100 on 2026-07-31, │
 * │               which was measured too tight for normal interactive    │
 * │               browsing (a single home-page load alone fires ~5       │
 * │               parallel API calls)                                    │
 * │  • Scope:     /api/* paths only — the proxied frontend's own asset/  │
 * │               page requests are not counted                          │
 * │  • Storage:   In-memory (Map keyed by IP address), cleaned up every  │
 * │               5 minutes                                              │
 * │  • Response:  HTTP 429 with a retryAfter (seconds) field the client  │
 * │               can surface directly                                   │
 * │  • Headers:   X-RateLimit-Limit, X-RateLimit-Remaining                │
 * │                                                                      │
 * │  Notes:                                                              │
 * │  • The rate limit map resets on process restart — acceptable for a   │
 * │    public scraping API where the limit deters abuse rather than      │
 * │    needing to be absolute.                                           │
 * │  • IP is extracted from req.ip, which respects TRUST_PROXY hops in   │
 * │    front of the app (Vercel/Render/etc.).                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  GZIP COMPRESSION                                                    │
 * ├──────────────────────────────────────────────────────────────────────┤
 * │                                                                      │
 * │  • Library:   compression 1.8 (Express middleware)                   │
 * │  • Threshold: 1 KB (responses smaller than this are sent raw)        │
 * │  • Level:     6 — balanced speed / ratio                             │
 * │  • Bypass:    clients can send X-No-Compression to opt out           │
 * └──────────────────────────────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9 — ERROR HANDLING STRATEGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 *  Success and error responses follow a consistent envelope:
 *
 *    { "success": true,  "results": { ... } }
 *    { "success": false, "message": "..." }
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  ERROR CATEGORIES                                                    │
 *  ├─────────────────────────────┬────────────────────────────────────────┤
 *  │  400 Bad Request            │  Missing/invalid query params         │
 *  │  403 Forbidden               │  Stream proxy: domain/content rejected│
 *  │  404 Not Found               │  Unknown route or missing resource    │
 *  │  413 Payload Too Large       │  Request body over the 10kb limit     │
 *  │  429 Too Many Requests       │  Rate limit exceeded                  │
 *  │  500 Internal Server Error   │  Unhandled exceptions / upstream fail │
 *  └─────────────────────────────┴────────────────────────────────────────┘
 *
 *  Error Propagation Chain:
 *
 *    Source Site Error / Timeout / All Mirrors Failed
 *          │
 *          ▼
 *    Extractor throws (propagates the underlying error)
 *          │
 *          ▼
 *    Controller catches and calls next(error)
 *          │
 *          ▼
 *    Express global error handler (server.js) formats the JSON response;
 *    hides the raw error message in production (NODE_ENV=production)
 *
 *  Timeout Handling:
 *    • Per-request timeout: 30s (REQUEST_TIMEOUT), returns 408 if it fires
 *      before headers are sent.
 *    • Per-mirror-attempt timeout inside fetchWithMirror: 15s default,
 *      with up to 2 retries per mirror before moving on.
 *
 *  Source Site Changes:
 *    • If anikototv.to changes its HTML structure, extractors may return
 *      empty or malformed data rather than throwing — this is a known,
 *      accepted risk of scraping (see docs/testing.md for how this is
 *      caught in practice).
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10 — SECURITY CONSIDERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  CORS POLICY                                                         │
 *  ├──────────────────────────────────────────────────────────────────────┤
 *  │  • Custom inline middleware in server.js — NOT the 'cors' npm        │
 *  │    package (that dependency was removed; a unified hand-written      │
 *  │    middleware replaced it).                                          │
 *  │  • Default: Allow all origins (*) for public API usage.             │
 *  │  • Restrictable via ALLOWED_ORIGINS (comma-separated allowlist).     │
 *  │  • Methods: GET, POST, OPTIONS.                                       │
 *  └──────────────────────────────────────────────────────────────────────┘
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  STREAM PROXY SECURITY (SSRF guard + content verification)          │
 *  ├──────────────────────────────────────────────────────────────────────┤
 *  │  /api/stream/proxy and /api/stream/ts-proxy fetch arbitrary-looking  │
 *  │  URLs on a client's behalf (M3U8 playlists and video segments), so   │
 *  │  they need real SSRF protection, not just a domain check:            │
 *  │                                                                      │
 *  │  1. Baseline guard (isSafeExternalUrl, streamProxy.config.js):        │
 *  │     scheme must be http/https, and the hostname is DNS-resolved and  │
 *  │     checked against private/loopback/link-local/reserved IP ranges   │
 *  │     (blocks the classic 169.254.169.254 metadata-endpoint SSRF       │
 *  │     pattern) before ANY fetch happens, regardless of domain.          │
 *  │  2. Domains in ALLOWED_STREAM_DOMAINS are trusted instantly (fast    │
 *  │     path) once they pass the baseline guard.                         │
 *  │  3. Domains outside that allowlist are NOT rejected outright — they  │
 *  │     are content-sniffed (streamSegmentGuard.helper.js): a real M3U8  │
 *  │     playlist must start with #EXTM3U; a real video segment must      │
 *  │     contain a genuine MPEG-TS (0x47 sync byte, 188-byte stride) or   │
 *  │     fMP4 (ftyp/styp box) signature. This was added 2026-07-31 after  │
 *  │     finding that ~97% of a real episode's segments were being        │
 *  │     wrongly dropped as "ads" because they came from a legitimate but │
 *  │     uncatalogued CDN domain, disguised behind a fake image header —  │
 *  │     a static allowlist alone can't keep up with that.                │
 *  └──────────────────────────────────────────────────────────────────────┘
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  INPUT VALIDATION                                                    │
 *  ├──────────────────────────────────────────────────────────────────────┤
 *  │  • Query/path parameters are checked for presence before use.        │
 *  │  • Path parameters are URL-encoded where necessary.                  │
 *  │  • No user-supplied data is interpolated into HTML templates.        │
 *  └──────────────────────────────────────────────────────────────────────┘
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  SECRETS MANAGEMENT                                                  │
 *  ├──────────────────────────────────────────────────────────────────────┤
 *  │  • No API keys, tokens, or secrets required by the codebase.         │
 *  │  • .gitignore excludes node_modules, .env, frontend/.next.           │
 *  │  • All upstream requests use public, non-authenticated endpoints.    │
 *  └──────────────────────────────────────────────────────────────────────┘
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  SECURITY HEADERS                                                    │
 *  ├──────────────────────────────────────────────────────────────────────┤
 *  │  Every response gets: Content-Security-Policy, Strict-Transport-      │
 *  │  Security, X-Frame-Options: DENY, X-Content-Type-Options: nosniff,   │
 *  │  X-XSS-Protection, Referrer-Policy, Permissions-Policy. The CSP's     │
 *  │  frame-src is built dynamically from ALLOWED_STREAM_DOMAINS (the      │
 *  │  /web player embeds third-party stream players in an iframe).        │
 *  └──────────────────────────────────────────────────────────────────────┘
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  DEPENDENCY FOOTPRINT                                                │
 *  ├──────────────────────────────────────────────────────────────────────┤
 *  │  • 6 backend runtime dependencies (see Section — Appendix).           │
 *  │  • No file system writes by the API itself.                         │
 *  └──────────────────────────────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 11 — DEPLOYMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 *  This project runs as a persistent Node process — it spawns the frontend
 *  as a child process and reverse-proxies to it, which a stateless
 *  serverless function structurally cannot do. Docker, Render, or a
 *  standalone server are the models that get the full API + frontend +
 *  /web experience; Vercel is API-only.
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  DOCKER / RENDER / STANDALONE (recommended)                          │
 *  ├──────────────────────────────────────────────────────────────────────┤
 *  │                                                                      │
 *  │  Dockerfile and render.yaml both:                                    │
 *  │    1. npm ci --omit=dev              (backend deps)                  │
 *  │    2. cd frontend && npm ci          (frontend deps, incl. devDeps   │
 *  │                                        needed to build)              │
 *  │    3. cd frontend && npm run build   (produces .next/)               │
 *  │    4. npm prune --omit=dev (frontend) (drops devDeps post-build)     │
 *  │    5. npm start                       (spawns "next start" in prod)  │
 *  │                                                                      │
 *  │  The cache, mirror-health cache, and rate-limit map all persist for  │
 *  │  the life of the process — no cold-start resets like serverless.     │
 *  └──────────────────────────────────────────────────────────────────────┘
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  VERCEL (API-only)                                                   │
 *  ├──────────────────────────────────────────────────────────────────────┤
 *  │                                                                      │
 *  │  vercel.json maps server.js to a @vercel/node serverless function    │
 *  │  and forwards all requests to it. This works fine for /api/* — but   │
 *  │  Vercel's serverless functions can't run the spawned Next.js child   │
 *  │  process, so the frontend and /web routes will not function there.  │
 *  │  This is a known, deliberate limitation (not a bug to "fix" by       │
 *  │  routing differently) — use Docker/Render/standalone for the full   │
 *  │  site.                                                                │
 *  │                                                                      │
 *  │  Serverless-specific notes (API path only):                          │
 *  │    • Runtime: Node.js 20.x (ESM)                                     │
 *  │    • Filesystem: read-only except /tmp — irrelevant here, the API    │
 *  │      never writes to disk                                            │
 *  │    • Cold start resets the in-memory cache and rate-limit map        │
 *  │    • Cache repopulates naturally on first request per endpoint       │
 *  └──────────────────────────────────────────────────────────────────────┘
 *
 *  Environment Variables: see README.md's Configuration section for the
 *  full table (PORT, ALLOWED_ORIGINS, RATE_LIMIT, RATE_WINDOW,
 *  REQUEST_TIMEOUT, CACHE_MAX_SIZE, CACHE_DEFAULT_TTL, MIRROR_DOMAINS,
 *  MIRROR_CACHE_TTL, NEXT_INTERNAL_PORT, API_INTERNAL_BASE). None are
 *  required — every one has a sensible default.
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 12 — TESTING STRATEGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  test.js — LIVE-NETWORK SMOKE TEST (not a mocked regression suite)   │
 *  ├──────────────────────────────────────────────────────────────────────┤
 *  │                                                                      │
 *  │  • ~45 checks against either a locally-running server (auto-        │
 *  │    detected) or the live production deployment as a fallback —      │
 *  │    there is no mocking layer, every run makes real network calls.   │
 *  │  • Assertions are loose presence/truthiness checks (e.g. "did        │
 *  │    `results` come back non-empty"), not deep structural validation.  │
 *  │  • No coverage for negative/error paths (invalid params, rate-limit  │
 *  │    behavior, the stream-proxy SSRF allowlist, pagination edges).     │
 *  │  • Because it depends on either a running local server or live       │
 *  │    third-party site availability, results can be flaky/non-          │
 *  │    deterministic — this is a known limitation, not a design goal.    │
 *  │                                                                      │
 *  │  Run:  node test.js   (or  npm test)                                 │
 *  └──────────────────────────────────────────────────────────────────────┘
 *
 *  See docs/testing.md for the full breakdown of what's covered and the
 *  "Real test coverage" item in README.md's Roadmap for what's planned to
 *  close this gap (mocked unit tests, negative-path coverage).
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  agents/ — reference docs, not invocable subagents                   │
 *  ├──────────────────────────────────────────────────────────────────────┤
 *  │                                                                      │
 *  │  api-tester.md, backend-architect.md, devops-automator.md,           │
 *  │  performance-benchmarker.md, security-architect.md,                  │
 *  │  technical-writer.md — these describe conventions/personas for       │
 *  │  working on this specific repo (e.g. technical-writer.md documents   │
 *  │  the README/CHANGELOG structure this file itself follows). They are  │
 *  │  plain reference markdown, not wired up as invocable AI subagents.   │
 *  └──────────────────────────────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 13 — VERSIONING & CHANGELOG NOTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  VERSION HISTORY                                                     │
 *  ├──────────────────────────────────────────────────────────────────────┤
 *  │                                                                      │
 *  │  v2.3.0  (Current)                                                  │
 *  │    • Documented the merged Next.js frontend + standalone /web app    │
 *  │      (the merge itself predates this changelog entry)                │
 *  │    • Content-signature stream proxy validation (fixed video          │
 *  │      playback being truncated to ~3% of real episode runtime)        │
 *  │    • Rate limit default raised 100 → 300 req/min                     │
 *  │    • Dockerfile/render.yaml now build the frontend correctly         │
 *  │    • parseListItem.helper.js selector-priority fix (was leaking a    │
 *  │      sidebar widget's items into paginated results)                  │
 *  │    • Dead status.controller.js/status.extractor.js removed           │
 *  │    • Several /web UI/UX and accessibility fixes                      │
 *  │                                                                      │
 *  │  v2.2.0                                                              │
 *  │    • Stream URL resolution, M3U8/TS proxy, mirror fallback for all   │
 *  │      extractors, shared parseListItem helper                         │
 *  │                                                                      │
 *  └──────────────────────────────────────────────────────────────────────┘
 *
 *  See CHANGELOG.md for the complete, unabridged version history.
 *
 *  Semantic Versioning:
 *    MAJOR — Breaking changes to API response shapes or endpoint removal
 *    MINOR — New endpoints, new data fields, or significant new
 *            capabilities (backward-compatible)
 *    PATCH — Bug fixes, extractor updates, dependency bumps
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION — APPENDIX: QUICK REFERENCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  ENDPOINT COUNT BY CATEGORY  (43 total registered routes)            │
 *  ├─────────────────────────────┬────────────────────────────────────────┤
 *  │  Discovery (browse)         │  home, trending, popular, spotlight,  │
 *  │                             │  topten, suggestion, random, schedule, │
 *  │                             │  upcoming, trending-sidebar            │
 *  │  Search & Filter            │  search, search/suggest, filter,       │
 *  │                             │  az-list, genre, type, status           │
 *  │  Anime Detail               │  info, watch, seasons, watch-order      │
 *  │  Episode & Stream           │  episodes, episodes-ajax, servers,      │
 *  │                             │  mapper-servers, stream, stream/       │
 *  │                             │  resolve, stream/qualities, stream/     │
 *  │                             │  proxy, stream/ts-proxy, download       │
 *  │  Lists                      │  new-release, newly-added,              │
 *  │                             │  latest-updated, top-rankings,          │
 *  │                             │  recently-updated, completed            │
 *  │  System                     │  health, stats, mirrors, mirrors/reset, │
 *  │                             │  cache/stats, openapi                   │
 *  └─────────────────────────────┴────────────────────────────────────────┘
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │  DEPENDENCY SUMMARY (6 backend runtime packages)                     │
 *  ├─────────────────────────────┬────────────────────────────────────────┤
 *  │  express               4.21 │  Web framework                        │
 *  │  cheerio                1.0 │  Server-side HTML parser              │
 *  │  axios                  1.8 │  HTTP client                          │
 *  │  compression             1.8 │  GZIP middleware                      │
 *  │  http-proxy-middleware   4.2 │  Reverse proxy to the Next.js frontend│
 *  │  dotenv                 16.4 │  Environment variables                │
 *  └─────────────────────────────┴────────────────────────────────────────┘
 *
 *  The LRU cache and CORS handling are both hand-rolled in this codebase,
 *  not separate npm packages.
 */

// ══════ END: architecture.md ══════
