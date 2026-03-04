// ============================================================
// Futbolpedia — Players Routes
// ============================================================
const express = require("express");
const router = express.Router();
const api = require("../services/thesportsdb");

/**
 * GET /api/player/:id
 * Returns details for a single player.
 */
router.get("/:id", async (req, res, next) => {
  try {
    const data = await api.getPlayerById(req.params.id);
    if (!data.players || data.players.length === 0) {
      return res.status(404).json({ error: "Player not found" });
    }
    res.json({ player: data.players[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
