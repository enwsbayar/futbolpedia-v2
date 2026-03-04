// ============================================================
// Futbolpedia — History Routes (local static data)
// ============================================================
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

const HISTORY_PATH = path.join(__dirname, "../../football_history.json");

let historyCache = null;

function loadHistory() {
  if (historyCache) return historyCache;
  try {
    const raw = fs.readFileSync(HISTORY_PATH, "utf-8");
    historyCache = JSON.parse(raw);
    return historyCache;
  } catch (err) {
    console.error(
      "[history] Failed to read football_history.json:",
      err.message,
    );
    return null;
  }
}

/**
 * GET /api/history
 * Returns the full local football history dataset.
 */
router.get("/", (req, res) => {
  const data = loadHistory();
  if (!data) {
    return res.status(500).json({ error: "Historical data unavailable." });
  }
  res.json(data);
});

/**
 * GET /api/history/players
 * Returns only the legendary players list.
 */
router.get("/players", (req, res) => {
  const data = loadHistory();
  if (!data)
    return res.status(500).json({ error: "Historical data unavailable." });
  res.json({ legendaryPlayers: data.legendaryPlayers || [] });
});

/**
 * GET /api/history/topscorers
 * Returns historical top scorers.
 */
router.get("/topscorers", (req, res) => {
  const data = loadHistory();
  if (!data)
    return res.status(500).json({ error: "Historical data unavailable." });
  res.json({ historicalTopScorers: data.historicalTopScorers || [] });
});

/**
 * GET /api/history/tournaments
 * Returns major tournament winners.
 */
router.get("/tournaments", (req, res) => {
  const data = loadHistory();
  if (!data)
    return res.status(500).json({ error: "Historical data unavailable." });
  res.json({ majorTournamentWinners: data.majorTournamentWinners || {} });
});

module.exports = router;
