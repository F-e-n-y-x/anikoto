/*
 * ======= • ======= • ======= • ======= • =======• =======
 * AniKotoAPI — server.js
 * Repository: https://github.com/Shineii86/AniKotoAPI
 *
 * @description
 *   Main entry point for the AniKotoAPI Express server.
 *   Configures CORS, middleware, static files, API routes,
 *   and 404 handling. Starts the server on the configured port.
 *
 * @exports
 *   None (side-effect: starts Express server)
 *
 * @author  Shinei Nouzen
 * @license MIT
 * ======= • ======= • ======= • ======= • =======• =======
 */

import dotenv from "dotenv";
import express from "express";
import compression from "compression";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { spawn } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createApiRoutes } from "./src/routes/apiRoutes.js";
import { ALLOWED_STREAM_DOMAINS } from "./src/configs/streamProxy.config.js";

dotenv.config();

// ══════════════════════════════════════════════════════════════
// SERVER CONFIGURATION
// ══════════════════════════════════════════════════════════════

const app = express();
// NOTE: Trust the first proxy hop (Vercel/Render/etc.) so req.ip reflects the
// real client IP instead of the proxy's — required for per-client rate limiting.
app.set("trust proxy", parseInt(process.env.TRUST_PROXY) || 1);
const PORT = process.env.PORT || 4444;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = path.join(process.cwd(), "public");
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",");

// ---- FEATURE: Response compression ----
app.use(compression({
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

// ---- FEATURE: Request body size limits ----
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// ══════════════════════════════════════════════════════════════
// REQUEST ID TRACKING
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Unique request ID for debugging ----
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
});

// ══════════════════════════════════════════════════════════════
// CORS MIDDLEWARE
// ══════════════════════════════════════════════════════════════

// NOTE: Single unified CORS middleware — handles all origin validation
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!allowedOrigins || allowedOrigins.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// ---- FEATURE: Security headers ----
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // NOTE: Next.js dev mode needs 'unsafe-eval' for its webpack/HMR runtime —
  // only relaxed outside production, since the proxied frontend shares this CSP.
  const scriptSrc = process.env.NODE_ENV === "production" ? "'self' 'unsafe-inline'" : "'self' 'unsafe-inline' 'unsafe-eval'";
  // NOTE: the watch page embeds third-party stream players in an <iframe> —
  // without frame-src, default-src 'self' silently blocks that embed.
  const frameSrc = `'self' ${ALLOWED_STREAM_DOMAINS.map((d) => `https://*.${d} https://${d}`).join(" ")}`;
  res.setHeader("Content-Security-Policy", `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' blob:; worker-src 'self' blob:; connect-src 'self'; frame-src ${frameSrc}`);
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  next();
});

// ══════════════════════════════════════════════════════════════
// STATIC FILES
// ══════════════════════════════════════════════════════════════

// NOTE: redirect: false prevents automatic redirects to index.html.
// index: false stops this from auto-serving public/index.html for "/" —
// that route is now owned by the proxied Next.js frontend (see below).
// NOTE: without an explicit Cache-Control, browsers apply heuristic caching
// to HTML with no cache headers at all and can silently keep serving a
// stale /web/index.html for a long time after we ship a fix — which has
// already caused confusion once (an old build with no functionality).
// HTML must always be revalidated; hashed/versioned assets could be cached
// hard, but nothing here is content-hashed yet, so keep it uniform.
app.use(
  express.static(publicDir, {
    redirect: false,
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    }
  })
);

// ══════════════════════════════════════════════════════════════
// CLEAN URL ROUTES
// ══════════════════════════════════════════════════════════════

// Serve HTML files without .html extension
app.get("/tos", (req, res) => {
  res.sendFile(path.join(publicDir, "tos.html"));
});

app.get("/privacy", (req, res) => {
  res.sendFile(path.join(publicDir, "privacy.html"));
});

// ---- FEATURE: Consumer browsing/player UI ----
// NOTE: this single-file app changes often; res.sendFile defaults to
// "Cache-Control: public, max-age=0" which browsers can still serve
// heuristically from disk cache without revalidating — force a real
// revalidation on every load so fixes here are never stuck behind a
// stale cached copy (this bit us once already).
app.get(["/web", "/web/"], (req, res) => {
  res.sendFile(path.join(publicDir, "web", "index.html"), { headers: { "Cache-Control": "no-cache" } });
});

// ---- FEATURE: Raw endpoint tester (developer tool) ----
app.get(["/web/api-tester", "/web/api-tester/"], (req, res) => {
  res.sendFile(path.join(publicDir, "web", "api-tester", "index.html"), { headers: { "Cache-Control": "no-cache" } });
});

// ══════════════════════════════════════════════════════════════
// RESPONSE HELPERS
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Standardized JSON response wrapper ----
/**
 * Wraps data in a standardized success JSON response.
 *
 * @param {object} res - Express response object
 * @param {*} data - The data to return in the response
 * @param {number} status - HTTP status code (default: 200)
 */
const jsonResponse = (res, data, status = 200) =>
  res.status(status).json({ success: true, results: data });

// ---- FEATURE: Standardized error response wrapper ----
/**
 * Returns a standardized error JSON response.
 *
 * @param {object} res - Express response object
 * @param {string} message - Error message to return (default: "Internal server error")
 * @param {number} status - HTTP status code (default: 500)
 */
const jsonError = (res, message = "Internal server error", status = 500) =>
  res.status(status).json({ success: false, message });

// ══════════════════════════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Rate limiting (configurable, default 300 requests per minute per IP) ----
// NOTE: was 100 — measured too tight for normal browsing in practice: a
// single home-page load alone fires ~5 parallel API calls, and typical
// interactive use (switching tabs, browsing anime, watching episodes,
// switching servers) comfortably exceeds 100/min without any abuse.
const requestCounts = new Map();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT) || 300;
const RATE_WINDOW = parseInt(process.env.RATE_WINDOW) || 60000;

// ---- FEATURE: Rate limiter cleanup interval (every 5 minutes) ----
const RATE_CLEANUP_INTERVAL = 300000;
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of requestCounts.entries()) {
    const validTimestamps = timestamps.filter(t => now - t < RATE_WINDOW);
    if (validTimestamps.length === 0) {
      requestCounts.delete(ip);
    } else {
      requestCounts.set(ip, validTimestamps);
    }
  }
}, RATE_CLEANUP_INTERVAL);

app.use((req, res, next) => {
  // NOTE: only rate-limit API calls — the proxied frontend's own asset/page
  // requests (JS chunks, images, RSC payloads) are far more numerous per
  // page view and would trip this limit almost immediately otherwise.
  if (!req.path.startsWith("/api")) {
    return next();
  }
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  const timestamps = requestCounts.get(ip).filter(t => now - t < RATE_WINDOW);
  requestCounts.set(ip, timestamps);
  if (timestamps.length >= RATE_LIMIT) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Try again later.",
      retryAfter: Math.ceil((timestamps[0] + RATE_WINDOW - now) / 1000)
    });
  }
  timestamps.push(now);
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT);
  res.setHeader("X-RateLimit-Remaining", RATE_LIMIT - timestamps.length);
  next();
});

// ---- FEATURE: Request timeout middleware (30 seconds) ----
app.use((req, res, next) => {
  const timeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000;
  req.setTimeout(timeout, () => {
    if (!res.headersSent) {
      res.status(408).json({ success: false, message: "Request timeout" });
    }
  });
  next();
});

createApiRoutes(app, jsonResponse, jsonError);

// ══════════════════════════════════════════════════════════════
// FRONTEND (Next.js) — spawned internally and reverse-proxied so the
// whole app (API + web UI) is reachable through a single port.
// ══════════════════════════════════════════════════════════════

const frontendDir = path.join(process.cwd(), "frontend");
const NEXT_INTERNAL_PORT = parseInt(process.env.NEXT_INTERNAL_PORT) || 4001;
let nextProcess = null;

if (fs.existsSync(path.join(frontendDir, "package.json"))) {
  const isProduction = process.env.NODE_ENV === "production";
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const nextArgs = isProduction ? ["run", "start"] : ["run", "dev"];

  nextProcess = spawn(npmCmd, nextArgs, {
    cwd: frontendDir,
    env: {
      ...process.env,
      PORT: String(NEXT_INTERNAL_PORT),
      // NOTE: tells server-side (RSC) fetches in the Next child where the
      // Express API actually lives — without this, the frontend falls back
      // to a hardcoded localhost:4444 that silently breaks if PORT is
      // changed from its default via the documented PORT env var.
      API_INTERNAL_BASE: `http://localhost:${PORT}/api`,
    },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  nextProcess.on("exit", (code) => {
    console.info(`[FRONTEND] Next.js process exited with code ${code}`);
    nextProcess = null;
  });

  // ---- FEATURE: Proxy every non-API, non-static request to Next.js ----
  app.use(
    createProxyMiddleware({
      target: `http://localhost:${NEXT_INTERNAL_PORT}`,
      changeOrigin: true,
      ws: true, // NOTE: required for Next.js's dev-mode HMR websocket
      logger: console,
    })
  );
} else {
  console.info("[FRONTEND] No frontend/ directory found — running API-only.");
}

// ══════════════════════════════════════════════════════════════
// 404 HANDLER
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Global error handler ----
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.id} ${err.message}`, err.stack);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: "Request entity too large" });
  }
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? "Internal server error" : err.message
  });
});

// ---- FEATURE: Catch-all 404 handler for undefined routes ----
app.use((req, res) => {
  const filePath = path.join(publicDir, "404.html");
  if (fs.existsSync(filePath)) {
    res.status(404).sendFile(filePath);
  } else {
    res.status(404).json({
      success: false,
      message: "Endpoint not found",
      availableEndpoints: [
        "/", "/search", "/search/suggest", "/info", "/watch",
        "/episodes/:id", "/episodes-ajax/:id", "/stream", "/servers",
        "/mapper-servers", "/download", "/stream/resolve",
        "/stream/qualities", "/stream/proxy", "/stream/ts-proxy",
        "/spotlight", "/trending", "/top-ten", "/suggestions",
        "/random", "/most-popular", "/upcoming", "/top-rankings",
        "/recently-updated", "/completed", "/new-release",
        "/newly-added", "/latest-updated", "/trending-sidebar",
        "/seasons/:id", "/watch-order/:id", "/az-list/:letter",
        "/filter", "/genre/:genre", "/type/:type", "/status/:status",
        "/schedule", "/health", "/stats", "/cache/stats",
        "/mirrors", "/openapi"
      ]
    });
  }
});

// ══════════════════════════════════════════════════════════════
// SERVER START
// ══════════════════════════════════════════════════════════════

const server = app.listen(PORT, () => {
  console.info(`AniKotoAPI listening at ${PORT}`);
});

// ══════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ══════════════════════════════════════════════════════════════

// ---- FEATURE: Graceful shutdown handling ----
const gracefulShutdown = (signal) => {
  console.info(`\n[SHUTDOWN] Received ${signal}. Starting graceful shutdown...`);
  if (nextProcess) {
    nextProcess.kill();
  }
  server.close(() => {
    console.info("[SHUTDOWN] Server closed. Goodbye.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("[SHUTDOWN] Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason, promise) => {
  console.error("[UNHANDLED] Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[UNCAUGHT] Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

// ══════════════════════════════════════════════════════════════ END: server.js
