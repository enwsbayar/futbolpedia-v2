// ============================================================
// Futbolpedia — Leagues Routes
// ============================================================
const express = require("express");
const router = express.Router();
const api = require("../services/thesportsdb");

/**
 * GET /api/leagues
 * Returns all soccer leagues.
 */
router.get("/", async (req, res, next) => {
  try {
    const data = await api.getAllLeagues();
    // Filter to soccer / football only
    const all = data.leagues || [];
    const soccer = all.filter(
      (l) => l.strSport && l.strSport.toLowerCase() === "soccer",
    );
    res.json({ leagues: soccer });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/league/:id
 * Returns details for a single league by its TheSportsDB id.
 */
router.get("/:id", async (req, res, next) => {
  try {
    const data = await api.getLeagueById(req.params.id);
    if (!data.leagues || data.leagues.length === 0) {
      return res.status(404).json({ error: "League not found" });
    }
    res.json({ league: data.leagues[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
