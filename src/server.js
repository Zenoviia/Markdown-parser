/*
 * Express-based HTTP server wrapper for Markdown API
 */
const express = require("express");
const api = require("./api");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

function createServer() {
  const app = express();

  // trust proxy if behind a reverse proxy (configurable)
  if (process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
  }

  // Security headers
  app.use(helmet());

  // JSON body parsing with configurable size limit to avoid extremely large payloads
  const BODY_LIMIT = process.env.BODY_SIZE_LIMIT || "100kb";
  app.use(express.json({ limit: BODY_LIMIT }));

  // Basic safeguard: reject requests without JSON Content-Type for POST endpoints
  app.use((req, res, next) => {
    if (req.method === "POST") {
      const ct = req.headers["content-type"] || "";
      if (!ct.includes("application/json")) {
        return res
          .status(400)
          .json({ error: "Content-Type must be application/json" });
      }
    }
    next();
  });

  // Rate limiting
  const RATE_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
  const RATE_MAX = parseInt(process.env.RATE_LIMIT_MAX || "100", 10);

  const globalLimiter = rateLimit({
    windowMs: RATE_WINDOW,
    max: RATE_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, slow down" },
  });

  app.use(globalLimiter);

  // Lightweight CORS headers for browser tests
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  app.post("/parse", (req, res) => {
    const body = req.body || {};
    if (typeof body.markdown !== "string") {
      return res.status(400).json({ error: "markdown required" });
    }
    const ast = api.parseToAST(body.markdown);
    if (!ast || typeof ast !== "object") {
      return res.status(500).json({ error: "failed to parse markdown" });
    }
    return res.json({ ast });
  });

  app.post("/convert", (req, res) => {
    const body = req.body || {};
    if (typeof body.markdown !== "string") {
      return res.status(400).json({ error: "markdown required" });
    }
    // route-specific limiter can be inserted here if needed
    const html = api.parseMarkdown(body.markdown);
    if (typeof html !== "string") {
      return res.status(500).json({ error: "failed to convert markdown" });
    }
    return res.json({ html });
  });

  app.post("/validate", (req, res) => {
    const body = req.body || {};
    const result = api.validate(body.markdown);
    if (typeof result !== "object") {
      return res.status(500).json({ error: "validation failed" });
    }
    return res.json(result);
  });

  app.post("/statistics", (req, res) => {
    const body = req.body || {};
    const stats = api.getStatistics(body.markdown);
    if (typeof stats !== "object") {
      return res.status(500).json({ error: "failed to compute statistics" });
    }
    return res.json(stats);
  });

  // JSON parse error handler and generic error handler
  app.use((err, req, res, next) => {
    if (err && err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
    if (
      err &&
      err instanceof SyntaxError &&
      err.status === 400 &&
      "body" in err
    ) {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
    if (err && err.status === 413) {
      return res.status(413).json({ error: "Payload too large" });
    }
    // fallback
    if (res.headersSent) return next(err);
    return res
      .status(500)
      .json({ error: (err && err.message) || "internal error" });
  });

  // fallback for unmatched routes
  app.use((req, res) => res.status(404).json({ error: "not found" }));

  return app;
}

module.exports = { createServer };
