// ============================================================
// Futbolpedia — Teams Routes
// ============================================================
const express = require("express");
const router = express.Router();
const api = require("../services/thesportsdb");

/**
 * GET /api/teams?league=English Premier League
 * Returns all teams in the given league.
 */
router.get("/", async (req, res, next) => {
  try {
    const league = req.query.league;
    if (!league) {
      return res
        .status(400)
        .json({ error: "Missing required query parameter: league" });
    }
    const data = await api.getTeamsByLeague(league);
    const teams = data.teams || [];
    res.json({ teams });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/team/byname/:name
 * Reliable team lookup using searchteams.php (lookupteam.php is broken with free key).
 */
router.get("/byname/:name", async (req, res, next) => {
  try {
    const data = await api.getTeamByName(req.params.name);
    let teams = data.teams || [];
    // Filter to soccer only
    teams = teams.filter(
      (t) => t.strSport && t.strSport.toLowerCase() === "soccer",
    );
    if (teams.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }
    // Return best match (exact name match first, otherwise first result)
    const exact = teams.find(
      (t) => t.strTeam.toLowerCase() === req.params.name.toLowerCase(),
    );
    res.json({ team: exact || teams[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/team/:id
 * Returns details for a single team.
 * NOTE: With free API key 3 this always returns Arsenal.
 * Frontend should prefer /api/team/byname/:name instead.
 */
router.get("/:id", async (req, res, next) => {
  try {
    const data = await api.getTeamById(req.params.id);
    if (!data.teams || data.teams.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }
    res.json({ team: data.teams[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/team/:id/players
 * Returns all players currently registered to a team.
 */
router.get("/:id/players", async (req, res, next) => {
  try {
    const data = await api.getPlayersByTeam(req.params.id);
    const players = data.player || [];
    res.json({ players });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/team/:id/lastevents
 * Returns recent match results for a team.
 */
router.get("/:id/lastevents", async (req, res, next) => {
  try {
    const data = await api.getLastEvents(req.params.id);
    res.json({ events: data.results || [] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/team/:id/nextevents
 * Returns upcoming fixtures for a team.
 */
router.get("/:id/nextevents", async (req, res, next) => {
  try {
    const data = await api.getNextEvents(req.params.id);
    res.json({ events: data.events || [] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
