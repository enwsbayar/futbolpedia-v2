// ============================================================
// Futbolpedia — Search Routes
// ============================================================
const express = require("express");
const router = express.Router();
const api = require("../services/thesportsdb");

/**
 * GET /api/searchTeam?name=Arsenal
 * Returns matching teams.
 */
router.get("/searchTeam", async (req, res, next) => {
  try {
    const name = req.query.name;
    if (!name || name.trim().length < 2) {
      return res
        .status(400)
        .json({ error: 'Query "name" must be at least 2 characters.' });
    }
    const data = await api.searchTeams(name.trim());
    // TheSportsDB returns all sports — filter to soccer
    let teams = data.teams || [];
    teams = teams.filter(
      (t) => t.strSport && t.strSport.toLowerCase() === "soccer",
    );
    res.json({ teams });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/searchPlayer?name=Messi
 * Returns matching players.
 */
router.get("/searchPlayer", async (req, res, next) => {
  try {
    const name = req.query.name;
    if (!name || name.trim().length < 2) {
      return res
        .status(400)
        .json({ error: 'Query "name" must be at least 2 characters.' });
    }
    const data = await api.searchPlayers(name.trim());
    let players = data.player || [];
    // Filter to soccer
    players = players.filter(
      (p) => p.strSport && p.strSport.toLowerCase() === "soccer",
    );
    res.json({ players });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
