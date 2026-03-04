// ============================================================
// Futbolpedia — Express Server
// ============================================================
// Production-ready backend that:
//   • Proxies all TheSportsDB API calls (never expose key to client)
//   • Serves the static frontend files
//   • Provides a local history JSON endpoint
//   • Returns a custom 404 page for unknown routes
// ============================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware -----------------------------------------------------

app.use(cors());
app.use(express.json());

// Request logger (simple)
app.use((req, _res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
    );
  }
  next();
});

// ---- API Routes -----------------------------------------------------

const teamsRouter = require("./routes/teams");
const playersRouter = require("./routes/players");
const leaguesRouter = require("./routes/leagues");
const searchRouter = require("./routes/search");
const historyRouter = require("./routes/history");

// Search routes (mounted at /api so paths become /api/searchTeam, /api/searchPlayer)
app.use("/api", searchRouter);

// Resource routes
app.use("/api/teams", teamsRouter); // GET /api/teams?league=...
app.use("/api/team", teamsRouter); // GET /api/team/:id, /api/team/:id/players
app.use("/api/player", playersRouter); // GET /api/player/:id
app.use("/api/leagues", leaguesRouter); // GET /api/leagues
app.use("/api/league", leaguesRouter); // GET /api/league/:id
app.use("/api/history", historyRouter); // GET /api/history

// ---- Static Frontend ------------------------------------------------

const FRONTEND = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND));

// SPA-style fallback: any non-API GET that doesn't match a file → 404.html
app.get("*", (req, res) => {
  // If the request looks like an HTML page that doesn't exist, send 404
  const requestedFile = path.join(FRONTEND, req.path);
  res.status(404).sendFile(path.join(FRONTEND, "404.html"), (err) => {
    if (err) {
      res.status(404).json({ error: "Page not found" });
    }
  });
});

// ---- Global Error Handler -------------------------------------------

app.use((err, _req, res, _next) => {
  console.error("[error]", err.message);

  // Axios-specific upstream errors
  if (err.response) {
    return res.status(502).json({
      error: "Upstream API error",
      details: err.response.status,
    });
  }

  if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
    return res.status(504).json({ error: "Upstream API timeout" });
  }

  res.status(500).json({ error: "Internal server error" });
});

// ---- Start ----------------------------------------------------------

app.listen(PORT, () => {
  console.log("");
  console.log("  ⚽  Futbolpedia server running");
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log(
    `  📡  API proxy  → TheSportsDB (key: ${process.env.THESPORTSDB_API_KEY ? "••••" : "MISSING"})`,
  );
  console.log("");
});
