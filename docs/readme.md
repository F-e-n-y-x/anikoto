# AniKotoAPI Documentation

> Free REST API for anime data. Browse, search, stream — no API key required.

## Overview

AniKotoAPI is a free, open-source REST API that provides anime data scraped from [anikototv.to](https://anikototv.to). It's built with Node.js, Express, and Cheerio, and deployed on Vercel.

**Base URL:** `https://anikototvapi.vercel.app/api`

## Quick Start

```bash
# Get homepage data (spotlight, trending, top-airing, genres)
curl https://anikototvapi.vercel.app/api

# Search for anime
curl "https://anikototvapi.vercel.app/api/search?keyword=naruto"

# Get anime info
curl "https://anikototvapi.vercel.app/api/info?id=naruto-eybxz"
```

**Live Response — Homepage:**

```json
{
  "success": true,
  "results": {
    "spotlights": [
      {
        "slug": "wistoria-wand-and-sword-season-2-dua04",
        "poster": "https://cdn.anipixcdn.co/background/101f58336250ee0d_1779363645.webp",
        "title": "Wistoria: Wand and Sword Season 2",
        "japaneseTitle": "Tsue to Tsurugi no Wistoria Season 2",
        "rating": "PG-13",
        "quality": "HD"
      }
    ],
    "trending": [
      {
        "slug": "witch-hat-atelier-ikmut/ep-11",
        "poster": "https://cdn.anipixcdn.co/thumbnail/0412057393e8a45b3ba8b16874b6034d.jpg",
        "title": "Witch Hat Atelier",
        "japaneseTitle": "Tongari Boushi no Atelier",
        "sub": 11,
        "dub": 11,
        "total": 13,
        "type": "TV"
      }
    ],
    "topAiring": [...],
    "genres": ["Action", "Adventure", "Cars", "Comedy", ...]
  }
}
```

## Features

- **38 Endpoints** — Home, search, info, episodes, streaming, schedule, seasons, watch order, download, and more
- **No API Key** — Just make requests, no registration needed
- **LRU Cache** — Configurable TTL per endpoint type (3min to 60min)
- **Multi-Mirror Fallback** — Automatic failover across 5 mirror domains
- **Response Compression** — Gzip compression for faster responses
- **Pagination Metadata** — All list endpoints include `pagination` object with `currentPage`, `totalPages`, `hasNext`, `hasPrev`
- **CORS Enabled** — Access from any domain
- **JSON Responses** — Standardized `{success, results}` format

## Documentation

- [API Endpoints Reference](endpoints.md) — Complete endpoint documentation with real responses
- [Streaming Flow Guide](streaming.md) — How to get stream URLs step by step
- [Code Examples](examples.md) — cURL, JavaScript, Python (all tested and working)
- [Architecture](architecture.md) — Project structure and design decisions
- [Testing](testing.md) — Integration test suite, auto-detection, and benchmarks

## Response Format

All endpoints return JSON in this format:

```json
{
  "success": true,
  "results": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Rate Limiting

Rate limiting is configurable via environment variables (`RATE_LIMIT`, `RATE_WINDOW`). Default is 300 requests per 60 seconds per IP. Includes `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers.

## Disclaimer

This API is for **educational purposes only**. It scrapes publicly available data from anikototv.to. We are not affiliated with or endorsed by AniKoto. All content belongs to its respective owners.
