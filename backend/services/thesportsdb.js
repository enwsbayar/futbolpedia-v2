// ============================================================
// Futbolpedia — TheSportsDB API Service
// ============================================================
// Central service for all TheSportsDB interactions.
// Every call goes through fetchFromAPI() which handles:
//   1. Cache lookup (fresh → return immediately)
//   2. Live API call  (success → cache + return)
//   3. Stale fallback (API error → return expired cache)
//   4. Hard error     (no cache at all → throw)
// ============================================================

const axios = require("axios");
const cache = require("../cache");

const API_KEY = process.env.THESPORTSDB_API_KEY || "3";
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// ---- generic fetcher ------------------------------------------------

async function fetchFromAPI(endpoint, cacheKey) {
  // 1. Fresh cache hit
  const fresh = cache.get(cacheKey);
  if (fresh) return fresh;

  try {
    const { data } = await axios.get(`${BASE}${endpoint}`, { timeout: 10000 });
    cache.set(cacheKey, data);
    return data;
  } catch (err) {
    // 3. Stale fallback
    const stale = cache.getStale(cacheKey);
    if (stale) {
      console.warn(
        `[cache] serving stale data for "${cacheKey}" — API error: ${err.message}`,
      );
      return stale;
    }
    // 4. Nothing cached — propagate
    throw err;
  }
}

// ---- public helpers -------------------------------------------------

/** Search teams by name */
async function searchTeams(query) {
  const key = `searchTeams:${query.toLowerCase()}`;
  return fetchFromAPI(`/searchteams.php?t=${encodeURIComponent(query)}`, key);
}

/** Search players by name */
async function searchPlayers(query) {
  const key = `searchPlayers:${query.toLowerCase()}`;
  return fetchFromAPI(`/searchplayers.php?p=${encodeURIComponent(query)}`, key);
}

/** Lookup a single team by TheSportsDB id (NOTE: broken with free key 3, always returns Arsenal) */
async function getTeamById(id) {
  const key = `team:${id}`;
  return fetchFromAPI(`/lookupteam.php?id=${id}`, key);
}

/**
 * Lookup a team by name using searchteams.php.
 * This is the RELIABLE method — lookupteam.php is broken with free API key.
 * Returns the best matching team object, or null.
 */
async function getTeamByName(name) {
  const key = `teamByName:${name.toLowerCase()}`;
  const data = await fetchFromAPI(
    `/searchteams.php?t=${encodeURIComponent(name)}`,
    key,
  );
  return data;
}

/** Lookup a single player by TheSportsDB id */
async function getPlayerById(id) {
  const key = `player:${id}`;
  return fetchFromAPI(`/lookupplayer.php?id=${id}`, key);
}

/** All teams in a given league (by league name string) */
async function getTeamsByLeague(leagueName) {
  const key = `teamsByLeague:${leagueName.toLowerCase()}`;
  return fetchFromAPI(
    `/search_all_teams.php?l=${encodeURIComponent(leagueName)}`,
    key,
  );
}

/** All players belonging to a team (by team id) */
async function getPlayersByTeam(teamId) {
  const key = `playersByTeam:${teamId}`;
  return fetchFromAPI(`/lookup_all_players.php?id=${teamId}`, key);
}

/** Lookup league details by id */
async function getLeagueById(id) {
  const key = `league:${id}`;
  return fetchFromAPI(`/lookupleague.php?id=${id}`, key);
}

/** Get all leagues (all sports — caller should filter for Soccer) */
async function getAllLeagues() {
  const key = "allLeagues";
  return fetchFromAPI("/all_leagues.php", key);
}

/** Search all seasons for a league */
async function getLeagueSeasons(leagueId) {
  const key = `leagueSeasons:${leagueId}`;
  return fetchFromAPI(`/search_all_seasons.php?id=${leagueId}`, key);
}

/** Get past events for a team */
async function getLastEvents(teamId) {
  const key = `lastEvents:${teamId}`;
  return fetchFromAPI(`/eventslast.php?id=${teamId}`, key);
}

/** Get next events for a team */
async function getNextEvents(teamId) {
  const key = `nextEvents:${teamId}`;
  return fetchFromAPI(`/eventsnext.php?id=${teamId}`, key);
}

module.exports = {
  searchTeams,
  searchPlayers,
  getTeamById,
  getTeamByName,
  getPlayerById,
  getTeamsByLeague,
  getPlayersByTeam,
  getLeagueById,
  getAllLeagues,
  getLeagueSeasons,
  getLastEvents,
  getNextEvents,
};
