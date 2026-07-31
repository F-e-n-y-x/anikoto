# // === HEADER ===
# AniKotoAPI v2.3.0
# Free REST API for Anime Data
# Scraping anikototv.to with Cheerio

---

![AniKotoAPI](https://img.shields.io/badge/AniKotoAPI-v2.3.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Endpoints](https://img.shields.io/badge/Endpoints-43-orange)
![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen)

> A fast, free REST API that scrapes anime data from **anikototv.to**.
> Built with Node.js, Cheerio, and deployed on Vercel serverless functions.

---

## // === QUICK START ===

### Get started in 3 steps:

**Step 1** — Make your first request:

```bash
curl https://anikototvapi.vercel.app/api/
```

**Step 2** — Search for an anime:

```bash
curl https://anikototvapi.vercel.app/api/search?q=naruto
```

**Step 3** — Get anime info:

```bash
curl https://anikototvapi.vercel.app/api/info?link=/anime/naruto
```

That's it. No API keys required.

---

## // === FEATURES ===

| Feature | Description |
|---|---|
| **43 Endpoints** | Full coverage of anime data, streaming, and discovery |
| **27 HTML Extractors** | Cheerio-based scrapers for robust data extraction |
| **27 Controllers** | Organized route handlers with clean separation of concerns |
| **Merged Frontend + `/web` Player** | Full Next.js site and a standalone browsing/player app, one port |
| **5 Mirror Domains** | Automatic failover across multiple source domains |
| **LRU Cache** | Per-endpoint TTL caching for performance |
| **Rate Limiting** | 300 requests per minute per IP (configurable via `RATE_LIMIT` env var) |
| **GZIP Compression** | Compressed responses for faster transfers |
| **Vercel Deployment** | Zero-config serverless deployment |
| **OpenAPI Spec** | Auto-generated API documentation at `/api/openapi` |
| **Health Checks** | System status and cache monitoring endpoints |

---

## // === ENDPOINTS OVERVIEW ===

### Home

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | Homepage data: featured, spotlight, sidebar content |

### Anime

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/info` | Full anime info, episodes, relations, recommendations |
| GET | `/api/seasons/:id` | Season/episode details for an anime |
| GET | `/api/watch-order/:id` | Canonical watch order for a series |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search` | Search anime by title |
| GET | `/api/search/suggest` | Autocomplete suggestions |
| GET | `/api/suggestions` | Trending/general suggestions |

### Episodes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/episodes/:id` | Episode list for an anime |
| GET | `/api/episodes-ajax/:id` | Lazy-loaded episode pagination |

### Streaming

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stream` | Master stream URL for an episode |
| GET | `/api/servers` | Available servers for an episode |
| GET | `/api/stream/resolve` | Resolve a streaming URL |
| GET | `/api/stream/qualities` | Available quality variants |
| GET | `/api/stream/proxy` | Proxied video stream |
| GET | `/api/stream/ts-proxy` | Proxied TS segment stream |
| GET | `/api/watch` | Watch page with stream data |
| GET | `/api/download` | Download link for an episode |
| GET | `/api/mapper-servers` | Server name mappings |

### Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/spotlight` | Featured/spotlight anime |
| GET | `/api/trending` | Currently trending anime |
| GET | `/api/top-ten` | Top 10 rankings |
| GET | `/api/random` | Random anime recommendation |
| GET | `/api/most-popular` | Most popular anime |
| GET | `/api/trending-sidebar` | Trending sidebar widget data |

### Releases

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/new-release` | Recently released episodes |
| GET | `/api/newly-added` | Newly added anime |
| GET | `/api/latest-updated` | Latest updated anime |
| GET | `/api/recently-updated` | Recently updated entries |
| GET | `/api/completed` | Completed anime |
| GET | `/api/upcoming` | Upcoming anime |

### Rankings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/top-rankings` | Top ranked anime by category |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/genre/:name` | Anime by genre |
| GET | `/api/type/:name` | Anime by type (TV, Movie, OVA, etc.) |
| GET | `/api/status/:name` | Anime by status (Airing, Completed, etc.) |
| GET | `/api/az-list/:letter` | Alphabetical listing |
| GET | `/api/filter` | Multi-criteria filter |

### Schedule

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schedule` | Anime release schedule |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check / uptime |
| GET | `/api/stats` | API statistics |
| GET | `/api/cache/stats` | Cache hit/miss statistics |
| GET | `/api/mirrors` | List available mirror domains |
| POST | `/api/mirrors/reset` | Reset failover mirror state |
| GET | `/api/openapi` | OpenAPI/Swagger spec |

---

## // === APPLICATION ARCHITECTURE ===

AniKotoAPI is no longer just a REST API — `server.js` now runs three things behind a single Express server on one port:

1. **The REST API** — every `/api/*` route, handled by the controllers/extractors described below.
2. **A Next.js frontend** (`frontend/`) — spawned by `server.js` as a child process (`npm run dev`/`npm run start`) on an internal port (`NEXT_INTERNAL_PORT`, default `4001`). Every request that isn't `/api/*` or a static asset is reverse-proxied to it via `http-proxy-middleware`, so it serves the main site at `/`. It talks back to the API over `API_INTERNAL_BASE` (`http://localhost:<PORT>/api`).
3. **A standalone browsing/player app** at `/web` (`public/web/index.html`) — a self-contained vanilla JS/HTML/CSS single-page app (no build step, no framework) that consumes the same `/api/*` endpoints to browse anime and play episodes directly in the browser.

If the `frontend/` directory or its `package.json` isn't present (e.g. a minimal API-only checkout), the Next.js spawn/proxy step is skipped and the server falls back to API + `/web` only.

## // === ARCHITECTURE ===

See [architecture.md](./architecture.md) for the full, accurate directory layout and component breakdown. In short: `src/controllers/` (27 route handlers), `src/extractors/` (27 Cheerio scrapers), `src/helper/` (cache, mirror fallback, pagination, etc.), `src/configs/`, `src/routes/`, plus `frontend/` (the Next.js site) and `public/web/` (the standalone player) — all served by one `server.js`.

### Key Design Patterns

- **Scraping Layer**: 27 Cheerio-based extractors parse HTML from anikototv.to, isolating page-specific logic from controllers.
- **Controller Layer**: 27 controllers map HTTP requests to extractor calls, handle validation, and format responses.
- **Cache Layer**: hand-rolled LRU cache with per-endpoint TTL reduces redundant scraping. TTLs range from 3 minutes (stream) to 60 minutes (genres) — see [architecture.md](./architecture.md#section-7) for the full matrix.
- **Mirror Layer**: 5 source domains with automatic failover. If one domain is slow or down, requests transparently fall back to the next mirror.
- **Rate Limiter**: Sliding-window request log per client IP, 300 requests per 1-minute window by default (configurable via `RATE_LIMIT`/`RATE_WINDOW`), scoped to `/api/*` only.

---

## // === GETTING STARTED ===

### Using cURL

```bash
# Get homepage data
curl https://anikototvapi.vercel.app/api/

# Search for an anime
curl "https://anikototvapi.vercel.app/api/search?keyword=one+piece"

# Get anime details
curl "https://anikototvapi.vercel.app/api/info?id=one-piece-odmau"

# Get streaming servers (ids come from the episodes response's server_ids field)
curl "https://anikototvapi.vercel.app/api/servers?ids=dXNCT3hNQzk3THhSTW8ySnM5..."

# Get trending anime
curl https://anikototvapi.vercel.app/api/trending
```

### Using JavaScript (fetch)

```javascript
const BASE = "https://anikototvapi.vercel.app/api";

// Search
const res = await fetch(`${BASE}/search?keyword=naruto`);
const data = await res.json();
console.log(data.results);
```

### Using Python (requests)

```python
import requests

BASE = "https://anikototvapi.vercel.app/api"

# Search
r = requests.get(f"{BASE}/search", params={"keyword": "naruto"})
print(r.json()["results"])
```

### Using Node.js (axios)

```javascript
const axios = require("axios");
const BASE = "https://anikototvapi.vercel.app/api";

async function searchAnime(keyword) {
  const { data } = await axios.get(`${BASE}/search`, {
    params: { keyword }
  });
  return data.results;
}
```

---

## // === RATE LIMITING ===

- **Limit**: 300 requests per 1-minute window (raised from the earlier 100/min default — a single home-page load alone fires ~5 parallel API calls, and normal interactive browsing comfortably exceeded 100/min)
- **Configurable**: via the `RATE_LIMIT` (requests) and `RATE_WINDOW` (window in ms, default `60000`) env vars in `server.js`
- **Scope**: Per client IP address, `/api/*` routes only — the proxied frontend's own page/asset requests are not counted
- **Headers**: `X-RateLimit-Limit` / `X-RateLimit-Remaining` returned on every API response
- **Exceeded**: Returns `429 Too Many Requests`

If you hit the rate limit, wait for the window to reset before retrying.

---

## // === MIRROR FAILOVER ===

AniKotoAPI maintains 5 mirror domains. When a request fails on the primary domain, the system automatically retries on the next available mirror.

```
Primary → Mirror 1 → Mirror 2 → Mirror 3 → Mirror 4 → Mirror 5
```

Use `/api/mirrors` to check current mirror status, or `POST /api/mirrors/reset` to reset the failover state.

---

## // === CACHING ===

The API uses a hand-rolled LRU (Least Recently Used) cache with per-endpoint TTL:

| Endpoint Category | TTL |
|-------------------|-----|
| Home | 10 minutes |
| Search / Suggestions | 5 minutes |
| Anime Info | 10 minutes |
| Episodes / Servers | 5–10 minutes |
| Stream | 3 minutes |
| Spotlight / Trending | 10 minutes |
| Schedule | 30 minutes |
| Genres / Types / Status | 60 minutes |
| Anything else | 5 minutes (default) |

Cache stats available at `/api/cache/stats`.

---

## // === ERROR RESPONSES ===

All errors return JSON with a consistent structure — the same envelope shape as a success response, just with `success: false`:

```json
{
  "success": false,
  "message": "Description of what went wrong"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / missing parameters |
| 403 | Stream proxy: domain or content rejected |
| 404 | Resource not found |
| 413 | Request body too large |
| 429 | Rate limit exceeded (response includes a `retryAfter` seconds field) |
| 500 | Internal server error |

---

## // === DOCUMENTATION ===

| File | Description |
|------|-------------|
| [endpoints.md](./endpoints.md) | Full API reference for all 43 endpoints |
| [streaming.md](./streaming.md) | Complete streaming workflow guide |
| [examples.md](./examples.md) | Working code examples in cURL, JS, Python |
| [architecture.md](./architecture.md) | Project structure and design patterns |
| [testing.md](./testing.md) | Integration test suite documentation |

---

## // === CONTRIBUTING ===

Contributions are welcome. To contribute:

1. Fork the repository from [GitHub](https://github.com/Shineii86/AniKotoAPI)
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and test them
4. Commit with a clear message
5. Push and open a Pull Request

### Development Setup

```bash
git clone https://github.com/Shineii86/AniKotoAPI.git
cd AniKotoAPI
npm install
npm run dev
```

### Guidelines

- Follow existing code style and patterns
- Add extractors in `src/extractors/` for new scraped pages
- Add controllers in `src/controllers/` and routes in `src/routes/apiRoutes.js` for new endpoints
- Update documentation when adding features
- Test all changes before submitting

---

## // === LICENSE ===

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Shinei Nouzen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## // === LINKS ===

- **Live API**: https://anikototvapi.vercel.app/api
- **GitHub**: https://github.com/Shineii86/AniKotoAPI
- **OpenAPI Spec**: https://anikototvapi.vercel.app/api/openapi
- **Health Check**: https://anikototvapi.vercel.app/api/health
- **Author**: [Shinei Nouzen](https://github.com/Shineii86)

---

// ══════ END: index.md ══════
