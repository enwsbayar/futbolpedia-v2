// ============================================================
// FUTBOLPEDIA — Main Client-Side Application
// ============================================================
// Single script that handles all pages:
//   • Home   — popular leagues, featured teams, history
//   • Team   — team profile, squad, recent results
//   • Player — player profile
//   • League — league info, all teams
//   • 404    — error page
// ============================================================

(function () {
  "use strict";

  // ==============================================================
  //  CONFIGURATION
  // ==============================================================

  const POPULAR_LEAGUES = [
    {
      id: "4328",
      name: "English Premier League",
      country: "England",
      emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    },
    { id: "4335", name: "Spanish La Liga", country: "Spain", emoji: "🇪🇸" },
    { id: "4332", name: "Italian Serie A", country: "Italy", emoji: "🇮🇹" },
    { id: "4331", name: "German Bundesliga", country: "Germany", emoji: "🇩🇪" },
    { id: "4334", name: "French Ligue 1", country: "France", emoji: "🇫🇷" },
    {
      id: "4480",
      name: "UEFA Champions League",
      country: "Europe",
      emoji: "🌍",
    },
    {
      id: "4337",
      name: "Dutch Eredivisie",
      country: "Netherlands",
      emoji: "🇳🇱",
    },
    {
      id: "4344",
      name: "Portuguese Primeira Liga",
      country: "Portugal",
      emoji: "🇵🇹",
    },
    {
      id: "4346",
      name: "American Major League Soccer",
      country: "USA",
      emoji: "🇺🇸",
    },
  ];

  // Default league to load featured teams from
  const DEFAULT_FEATURED_LEAGUE = "English Premier League";

  // Placeholder image for missing badges/photos
  const PLACEHOLDER_IMG =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23ccc"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50" y="55" text-anchor="middle" font-size="40">⚽</text></svg>',
    );

  const PLACEHOLDER_PLAYER =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e0e0e0"/><text x="50" y="58" text-anchor="middle" font-size="36">👤</text></svg>',
    );

  // ==============================================================
  //  UTILITY FUNCTIONS
  // ==============================================================

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function $$(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function showLoading() {
    const el = $("#loading-overlay");
    if (el) el.classList.add("active");
  }

  function hideLoading() {
    const el = $("#loading-overlay");
    if (el) el.classList.remove("active");
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  function imgSrc(url, fallback) {
    return url && url.trim() ? url : fallback || PLACEHOLDER_IMG;
  }

  async function apiGet(endpoint) {
    const res = await fetch(endpoint);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  function renderError(container, message) {
    container.innerHTML = `
      <div class="api-error">
        <h3>⚠️ Something went wrong</h3>
        <p>${escapeHTML(message)}</p>
        <p>Please try again later, or <a href="index.html">return home</a>.</p>
      </div>`;
  }

  function renderNotFound(container, type) {
    container.innerHTML = `
      <div class="error-page">
        <div class="error-icon">🔍</div>
        <h2>${escapeHTML(type)} Not Found</h2>
        <p>We couldn't find the ${type.toLowerCase()} you were looking for.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:1rem">Return Home</a>
      </div>`;
  }

  // ==============================================================
  //  GLOBAL SEARCH
  // ==============================================================

  function initSearch() {
    // Header search
    const input = $("#global-search");
    const dropdown = $("#search-results");
    if (input && dropdown) {
      wireSearch(input, dropdown);
    }

    // Hero search (home page)
    const heroInput = $("#hero-search-input");
    const heroDropdown = $("#hero-search-results");
    const heroBtn = $("#hero-search-btn");
    if (heroInput && heroDropdown) {
      wireSearch(heroInput, heroDropdown);
      if (heroBtn) {
        heroBtn.addEventListener("click", () => {
          heroInput.dispatchEvent(new Event("input"));
        });
      }
    }
  }

  function wireSearch(input, dropdown) {
    let abortController = null;

    const doSearch = debounce(async () => {
      const q = input.value.trim();
      if (q.length < 2) {
        dropdown.classList.remove("active");
        dropdown.innerHTML = "";
        return;
      }

      // Show loading state
      dropdown.innerHTML = '<div class="search-loading">Searching…</div>';
      dropdown.classList.add("active");

      if (abortController) abortController.abort();
      abortController = new AbortController();

      try {
        const [teamsRes, playersRes] = await Promise.all([
          apiGet(`/api/searchTeam?name=${encodeURIComponent(q)}`),
          apiGet(`/api/searchPlayer?name=${encodeURIComponent(q)}`),
        ]);

        const teams = (teamsRes.teams || []).slice(0, 6);
        const players = (playersRes.players || []).slice(0, 6);

        if (teams.length === 0 && players.length === 0) {
          dropdown.innerHTML =
            '<div class="search-empty">No results found.</div>';
          return;
        }

        let html = "";

        if (teams.length > 0) {
          html += '<div class="search-category">Teams</div>';
          teams.forEach((t) => {
            html += `
              <a href="team.html?id=${t.idTeam}&name=${encodeURIComponent(t.strTeam)}" class="search-item">
                <img src="${imgSrc(t.strBadge || t.strTeamBadge)}" alt="" loading="lazy">
                <div class="search-item-text">
                  <span class="search-item-name">${escapeHTML(t.strTeam)}</span>
                  <span class="search-item-meta">${escapeHTML(t.strLeague || "")} · ${escapeHTML(t.strCountry || "")}</span>
                </div>
              </a>`;
          });
        }

        if (players.length > 0) {
          html += '<div class="search-category">Players</div>';
          players.forEach((p) => {
            html += `
              <a href="player.html?id=${p.idPlayer}" class="search-item">
                <img src="${imgSrc(p.strThumb || p.strCutout, PLACEHOLDER_PLAYER)}" alt="" loading="lazy">
                <div class="search-item-text">
                  <span class="search-item-name">${escapeHTML(p.strPlayer)}</span>
                  <span class="search-item-meta">${escapeHTML(p.strPosition || "")} · ${escapeHTML(p.strTeam || "")}</span>
                </div>
              </a>`;
          });
        }

        dropdown.innerHTML = html;
      } catch (err) {
        if (err.name === "AbortError") return;
        dropdown.innerHTML =
          '<div class="search-empty">Search failed. Please try again.</div>';
      }
    }, 350);

    input.addEventListener("input", doSearch);

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
      }
    });

    // Re-open if there's content
    input.addEventListener("focus", () => {
      if (dropdown.innerHTML.trim()) dropdown.classList.add("active");
    });
  }

  // ==============================================================
  //  MOBILE MENU
  // ==============================================================

  function initMobileMenu() {
    const btn = $("#mobile-menu-btn");
    const nav = $("#header-nav");
    const sidebar = $("#sidebar");

    if (btn) {
      btn.addEventListener("click", () => {
        if (nav) nav.classList.toggle("active");
        if (sidebar) sidebar.classList.toggle("active");
      });
    }
  }

  // ==============================================================
  //  HOME PAGE
  // ==============================================================

  async function initHomePage() {
    renderPopularLeagues();
    loadFeaturedTeams();
    loadHistoryData();
  }

  function renderPopularLeagues() {
    const grid = $("#popular-leagues-grid");
    if (!grid) return;

    grid.innerHTML = POPULAR_LEAGUES.map(
      (league) => `
      <a href="league.html?id=${league.id}" class="card">
        <div style="font-size:2rem">${league.emoji}</div>
        <span class="card-title">${escapeHTML(league.name)}</span>
        <span class="card-subtitle">${escapeHTML(league.country)}</span>
      </a>
    `,
    ).join("");
  }

  async function loadFeaturedTeams() {
    const grid = $("#featured-teams-grid");
    if (!grid) return;

    grid.innerHTML = '<div class="inline-spinner"></div>';

    try {
      const data = await apiGet(
        `/api/teams?league=${encodeURIComponent(DEFAULT_FEATURED_LEAGUE)}`,
      );
      const teams = (data.teams || []).slice(0, 12);

      if (teams.length === 0) {
        grid.innerHTML =
          '<div class="empty-state"><div class="empty-icon">⚽</div><p>No teams available.</p></div>';
        return;
      }

      grid.innerHTML = teams
        .map(
          (t) => `
        <a href="team.html?id=${t.idTeam}&name=${encodeURIComponent(t.strTeam)}" class="card">
          <img src="${imgSrc(t.strBadge || t.strTeamBadge)}" alt="${escapeHTML(t.strTeam)}" loading="lazy">
          <span class="card-title">${escapeHTML(t.strTeam)}</span>
          <span class="card-subtitle">${escapeHTML(t.strStadium || "")}</span>
        </a>
      `,
        )
        .join("");

      // Update hero stat
      const stat = $("#hero-stat");
      if (stat) {
        stat.textContent = `Currently showing ${teams.length} teams from the ${DEFAULT_FEATURED_LEAGUE}. Search to explore more!`;
      }
    } catch (err) {
      grid.innerHTML = `<div class="api-error"><h3>⚠️ Could not load teams</h3><p>${escapeHTML(err.message)}</p></div>`;
    }
  }

  async function loadHistoryData() {
    try {
      const data = await apiGet("/api/history");
      renderLegendaryPlayers(data.legendaryPlayers || []);
      renderTopScorers(data.historicalTopScorers || []);
      renderWorldCupWinners(data.majorTournamentWinners?.fifaWorldCup || []);
      renderWorldCupWins(data.worldCupTotalWins || []);
    } catch (err) {
      console.warn("Could not load history:", err.message);
    }
  }

  function renderLegendaryPlayers(players) {
    const grid = $("#legendary-players-grid");
    if (!grid || players.length === 0) return;

    grid.innerHTML = players
      .map(
        (p) => `
      <div class="history-card">
        <div class="history-card-header">${escapeHTML(p.name)}</div>
        <div class="history-card-body">
          <div class="meta">
            🏳️ ${escapeHTML(p.nationality)} · ${escapeHTML(p.position)} · ${escapeHTML(p.career)}
          </div>
          <div class="description">${escapeHTML(p.description).substring(0, 200)}${p.description.length > 200 ? "…" : ""}</div>
          ${
            p.achievements && p.achievements.length > 0
              ? `
            <ul class="achievements">
              ${p.achievements
                .slice(0, 3)
                .map((a) => `<li>${escapeHTML(a)}</li>`)
                .join("")}
            </ul>
          `
              : ""
          }
        </div>
      </div>
    `,
      )
      .join("");
  }

  function renderTopScorers(scorers) {
    const tbody = $("#top-scorers-body");
    if (!tbody || scorers.length === 0) return;

    tbody.innerHTML = scorers
      .map(
        (s) => `
      <tr>
        <td>${s.rank}</td>
        <td><strong>${escapeHTML(s.name)}</strong></td>
        <td>${escapeHTML(s.nationality)}</td>
        <td>${s.goals.toLocaleString()}</td>
        <td>${escapeHTML(s.period)}</td>
      </tr>
    `,
      )
      .join("");
  }

  function renderWorldCupWinners(winners) {
    const tbody = $("#world-cup-body");
    if (!tbody || winners.length === 0) return;

    tbody.innerHTML = winners
      .map(
        (w) => `
      <tr>
        <td>${w.year}</td>
        <td>${escapeHTML(w.host)}</td>
        <td><strong>${escapeHTML(w.winner)}</strong></td>
        <td>${escapeHTML(w.runnerUp)}</td>
        <td>${escapeHTML(w.score)}</td>
      </tr>
    `,
      )
      .join("");
  }

  function renderWorldCupWins(wins) {
    const tbody = $("#wc-wins-body");
    if (!tbody || wins.length === 0) return;

    tbody.innerHTML = wins
      .map(
        (w) => `
      <tr>
        <td><strong>${escapeHTML(w.country)}</strong></td>
        <td>${w.wins}</td>
        <td>${w.years.join(", ")}</td>
      </tr>
    `,
      )
      .join("");
  }

  // ==============================================================
  //  TEAM PAGE
  // ==============================================================

  async function initTeamPage() {
    const id = getParam("id");
    const name = getParam("name");
    if (!id && !name) {
      renderNotFound($("#team-container"), "Team");
      return;
    }

    showLoading();

    try {
      let team = null;
      let teamId = id;

      // Primary: use name-based search (reliable with free key)
      if (name) {
        const data = await apiGet(
          `/api/team/byname/${encodeURIComponent(name)}`,
        );
        team = data.team;
        if (team) teamId = team.idTeam;
      }

      // Fallback: try ID-based lookup (may return Arsenal with free key)
      if (!team && id) {
        try {
          const data = await apiGet(`/api/team/${id}`);
          team = data.team;
        } catch (e) {
          console.warn("Team lookup by ID failed:", e.message);
        }
      }

      if (!team) {
        renderNotFound($("#team-container"), "Team");
        return;
      }

      document.title = `${team.strTeam} — Futbolpedia`;
      updateBreadcrumb(team.strTeam, team.strLeague, team.idLeague);
      renderTeamProfile(team);

      // Load squad asynchronously using team ID
      loadSquad(teamId);
      loadRecentResults(teamId);
    } catch (err) {
      renderError($("#team-container"), err.message);
    } finally {
      hideLoading();
    }
  }

  function updateBreadcrumb(teamName, leagueName, leagueId) {
    const bc = $("#breadcrumb");
    if (!bc) return;
    let html = '<a href="index.html">Home</a>';
    if (leagueName && leagueId) {
      html += ` &rsaquo; <a href="league.html?id=${leagueId}">${escapeHTML(leagueName)}</a>`;
    }
    html += ` &rsaquo; <span>${escapeHTML(teamName)}</span>`;
    bc.innerHTML = html;
  }

  function renderTeamProfile(team) {
    const container = $("#team-container");
    if (!container) return;

    const description =
      team.strDescriptionEN ||
      team.strDescription ||
      "No description available.";
    const descriptionParagraphs = description
      .split("\n")
      .filter((p) => p.trim())
      .map((p) => `<p>${escapeHTML(p)}</p>`)
      .join("");

    container.innerHTML = `
      <h1 class="article-title" id="overview">${escapeHTML(team.strTeam)}</h1>

      <div class="article-layout">
        <div class="article-body">
          <section class="article-description" id="description">
            ${descriptionParagraphs}
          </section>

          <section class="content-section" id="squad">
            <h2 class="section-heading">Current Squad</h2>
            <div id="squad-container">
              <div class="inline-spinner"></div>
            </div>
          </section>

          <section class="content-section" id="recent-results">
            <h2 class="section-heading">Recent Results</h2>
            <div id="results-container">
              <div class="inline-spinner"></div>
            </div>
          </section>
        </div>

        <div class="infobox">
          <div class="infobox-header">${escapeHTML(team.strTeam)}</div>
          ${
            team.strBadge || team.strTeamBadge
              ? `
            <div class="infobox-image">
              <img src="${imgSrc(team.strBadge || team.strTeamBadge)}" alt="${escapeHTML(team.strTeam)} badge">
            </div>
          `
              : ""
          }
          <table>
            <tr><th>Full Name</th><td>${escapeHTML(team.strTeam)}</td></tr>
            ${team.strTeamShort ? `<tr><th>Short Name</th><td>${escapeHTML(team.strTeamShort)}</td></tr>` : ""}
            ${team.intFormedYear ? `<tr><th>Founded</th><td>${team.intFormedYear}</td></tr>` : ""}
            ${team.strStadium ? `<tr><th>Stadium</th><td>${escapeHTML(team.strStadium)}${team.intStadiumCapacity ? ` (${Number(team.intStadiumCapacity).toLocaleString()})` : ""}</td></tr>` : ""}
            ${team.strStadiumLocation ? `<tr><th>Location</th><td>${escapeHTML(team.strStadiumLocation)}</td></tr>` : ""}
            ${team.strCountry ? `<tr><th>Country</th><td>${escapeHTML(team.strCountry)}</td></tr>` : ""}
            ${team.strLeague ? `<tr><th>League</th><td><a href="league.html?id=${team.idLeague}">${escapeHTML(team.strLeague)}</a></td></tr>` : ""}
            ${team.strManager ? `<tr><th>Manager</th><td>${escapeHTML(team.strManager)}</td></tr>` : ""}
            ${team.strKeywords ? `<tr><th>Nicknames</th><td>${escapeHTML(team.strKeywords)}</td></tr>` : ""}
            ${team.strWebsite ? `<tr><th>Website</th><td><a href="https://${team.strWebsite}" target="_blank" rel="noopener">${escapeHTML(team.strWebsite)}</a></td></tr>` : ""}
          </table>
          ${
            team.strStadiumThumb
              ? `
            <div class="infobox-image" style="border-top:1px solid var(--color-border-light)">
              <img src="${team.strStadiumThumb}" alt="${escapeHTML(team.strStadium || "Stadium")}" loading="lazy">
              <div style="font-size:0.78rem;color:var(--color-text-muted);padding:0.3rem">${escapeHTML(team.strStadium || "")}</div>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;

    // Update sidebar TOC with team-specific links
    const toc = $("#sidebar-toc");
    if (toc) {
      toc.innerHTML = `
        <li><a href="#overview">Overview</a></li>
        <li><a href="#description">Description</a></li>
        <li><a href="#squad">Current Squad</a></li>
        <li><a href="#recent-results">Recent Results</a></li>
      `;
    }
  }

  async function loadSquad(teamId) {
    const container = $("#squad-container");
    if (!container) return;

    try {
      const data = await apiGet(`/api/team/${teamId}/players`);
      const players = data.players || [];

      if (players.length === 0) {
        container.innerHTML =
          '<div class="empty-state"><div class="empty-icon">👥</div><p>Squad data not available.</p></div>';
        return;
      }

      // Group by position
      const positions = {};
      const posOrder = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

      players.forEach((p) => {
        const pos = p.strPosition || "Unknown";
        if (!positions[pos]) positions[pos] = [];
        positions[pos].push(p);
      });

      let html = "";
      // Render in order, then any remaining
      const rendered = new Set();
      for (const pos of posOrder) {
        // Find matching position group (partial match)
        for (const [key, group] of Object.entries(positions)) {
          if (
            key.toLowerCase().includes(pos.toLowerCase()) &&
            !rendered.has(key)
          ) {
            rendered.add(key);
            html += renderPositionGroup(key, group);
          }
        }
      }
      // Remaining positions
      for (const [key, group] of Object.entries(positions)) {
        if (!rendered.has(key)) {
          html += renderPositionGroup(key, group);
        }
      }

      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<div class="api-error"><p>Could not load squad: ${escapeHTML(err.message)}</p></div>`;
    }
  }

  function renderPositionGroup(position, players) {
    return `
      <div class="squad-position-group">
        <h3>${escapeHTML(position)}s (${players.length})</h3>
        <div class="squad-grid">
          ${players
            .map(
              (p) => `
            <a href="player.html?id=${p.idPlayer}" class="squad-card">
              <img src="${imgSrc(p.strThumb || p.strCutout, PLACEHOLDER_PLAYER)}" alt="${escapeHTML(p.strPlayer)}" loading="lazy">
              <div class="squad-card-info">
                <span class="squad-card-name">${escapeHTML(p.strPlayer)}</span>
                <span class="squad-card-pos">${escapeHTML(p.strNationality || "")}</span>
              </div>
            </a>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  async function loadRecentResults(teamId) {
    const container = $("#results-container");
    if (!container) return;

    try {
      const data = await apiGet(`/api/team/${teamId}/lastevents`);
      const events = data.events || [];

      if (events.length === 0) {
        container.innerHTML =
          '<div class="empty-state"><p>No recent results available.</p></div>';
        return;
      }

      container.innerHTML = `
        <table class="results-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Home</th>
              <th>Score</th>
              <th>Away</th>
              <th>League</th>
            </tr>
          </thead>
          <tbody>
            ${events
              .map(
                (e) => `
              <tr>
                <td>${formatDate(e.dateEvent)}</td>
                <td>${escapeHTML(e.strHomeTeam)}</td>
                <td class="score">${e.intHomeScore ?? "?"} – ${e.intAwayScore ?? "?"}</td>
                <td>${escapeHTML(e.strAwayTeam)}</td>
                <td>${escapeHTML(e.strLeague || "")}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `;
    } catch (err) {
      container.innerHTML = `<div class="api-error"><p>Could not load results: ${escapeHTML(err.message)}</p></div>`;
    }
  }

  // ==============================================================
  //  PLAYER PAGE
  // ==============================================================

  async function initPlayerPage() {
    const id = getParam("id");
    if (!id) {
      renderNotFound($("#player-container"), "Player");
      return;
    }

    showLoading();

    try {
      const data = await apiGet(`/api/player/${id}`);
      const player = data.player;
      if (!player) {
        renderNotFound($("#player-container"), "Player");
        hideLoading();
        return;
      }

      document.title = `${player.strPlayer} — Futbolpedia`;
      renderPlayerProfile(player);
    } catch (err) {
      renderError($("#player-container"), err.message);
    } finally {
      hideLoading();
    }
  }

  function renderPlayerProfile(player) {
    const container = $("#player-container");
    if (!container) return;

    // Breadcrumb
    const bc = $("#breadcrumb");
    if (bc) {
      let html = '<a href="index.html">Home</a>';
      if (player.strTeam && player.idTeam) {
        html += ` &rsaquo; <a href="team.html?id=${player.idTeam}&name=${encodeURIComponent(player.strTeam)}">${escapeHTML(player.strTeam)}</a>`;
      }
      html += ` &rsaquo; <span>${escapeHTML(player.strPlayer)}</span>`;
      bc.innerHTML = html;
    }

    const description = player.strDescriptionEN || player.strDescription || "";
    const descParagraphs = description
      ? description
          .split("\n")
          .filter((p) => p.trim())
          .map((p) => `<p>${escapeHTML(p)}</p>`)
          .join("")
      : "<p><em>No biography available for this player.</em></p>";

    const height = player.strHeight ? player.strHeight : null;
    const weight = player.strWeight ? player.strWeight : null;

    container.innerHTML = `
      <h1 class="article-title" id="overview">${escapeHTML(player.strPlayer)}</h1>

      <div class="article-layout">
        <div class="article-body">
          <section class="article-description" id="biography">
            ${descParagraphs}
          </section>
        </div>

        <div class="infobox">
          <div class="infobox-header">${escapeHTML(player.strPlayer)}</div>
          ${
            player.strThumb || player.strCutout || player.strRender
              ? `
            <div class="infobox-image">
              <img src="${imgSrc(player.strThumb || player.strCutout || player.strRender, PLACEHOLDER_PLAYER)}" alt="${escapeHTML(player.strPlayer)}">
            </div>
          `
              : `
            <div class="infobox-image">
              <img src="${PLACEHOLDER_PLAYER}" alt="${escapeHTML(player.strPlayer)}">
            </div>
          `
          }
          <table>
            <tr><th>Full Name</th><td>${escapeHTML(player.strPlayer)}</td></tr>
            ${player.strPosition ? `<tr><th>Position</th><td>${escapeHTML(player.strPosition)}</td></tr>` : ""}
            ${player.strNationality ? `<tr><th>Nationality</th><td>${escapeHTML(player.strNationality)}</td></tr>` : ""}
            ${player.dateBorn ? `<tr><th>Date of Birth</th><td>${formatDate(player.dateBorn)}</td></tr>` : ""}
            ${player.strBirthLocation ? `<tr><th>Place of Birth</th><td>${escapeHTML(player.strBirthLocation)}</td></tr>` : ""}
            ${height ? `<tr><th>Height</th><td>${escapeHTML(height)}</td></tr>` : ""}
            ${weight ? `<tr><th>Weight</th><td>${escapeHTML(weight)}</td></tr>` : ""}
            ${player.strTeam ? `<tr><th>Current Team</th><td><a href="team.html?id=${player.idTeam}&name=${encodeURIComponent(player.strTeam)}">${escapeHTML(player.strTeam)}</a></td></tr>` : ""}
            ${player.strNumber ? `<tr><th>Squad Number</th><td>${escapeHTML(player.strNumber)}</td></tr>` : ""}
            ${player.strSigning ? `<tr><th>Signed</th><td>${escapeHTML(player.strSigning)}</td></tr>` : ""}
            ${player.strWage ? `<tr><th>Wage</th><td>${escapeHTML(player.strWage)}</td></tr>` : ""}
            ${player.strKit ? `<tr><th>Kit Number</th><td>${escapeHTML(player.strKit)}</td></tr>` : ""}
            ${player.strAgent ? `<tr><th>Agent</th><td>${escapeHTML(player.strAgent)}</td></tr>` : ""}
          </table>
          ${
            player.strFanart1
              ? `
            <div class="infobox-image" style="border-top:1px solid var(--color-border-light)">
              <img src="${player.strFanart1}" alt="${escapeHTML(player.strPlayer)}" loading="lazy">
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;

    // Update sidebar TOC
    const toc = $("#sidebar-toc");
    if (toc) {
      toc.innerHTML = `
        <li><a href="#overview">Overview</a></li>
        <li><a href="#biography">Biography</a></li>
      `;
    }
  }

  // ==============================================================
  //  LEAGUE PAGE
  // ==============================================================

  async function initLeaguePage() {
    const id = getParam("id");
    const name = getParam("name");

    if (!id && !name) {
      renderNotFound($("#league-container"), "League");
      return;
    }

    showLoading();

    try {
      // If we have an ID, fetch league details
      let leagueInfo = null;
      if (id) {
        try {
          const leagueData = await apiGet(`/api/league/${id}`);
          leagueInfo = leagueData.league;
        } catch (e) {
          console.warn("Could not fetch league details:", e.message);
        }
      }

      // Get teams — need the league name
      let leagueName = name;
      if (leagueInfo) {
        leagueName = leagueInfo.strLeague;
      } else if (!leagueName) {
        // Try to find the name from our known leagues
        const known = POPULAR_LEAGUES.find((l) => l.id === id);
        if (known) leagueName = known.name;
      }

      if (!leagueName) {
        renderNotFound($("#league-container"), "League");
        hideLoading();
        return;
      }

      document.title = `${leagueName} — Futbolpedia`;

      // Update breadcrumb
      const bc = $("#breadcrumb");
      if (bc) {
        bc.innerHTML = `<a href="index.html">Home</a> &rsaquo; <span>${escapeHTML(leagueName)}</span>`;
      }

      const teamsData = await apiGet(
        `/api/teams?league=${encodeURIComponent(leagueName)}`,
      );
      const teams = teamsData.teams || [];

      renderLeaguePage(leagueInfo, leagueName, teams);
    } catch (err) {
      renderError($("#league-container"), err.message);
    } finally {
      hideLoading();
    }
  }

  function renderLeaguePage(leagueInfo, leagueName, teams) {
    const container = $("#league-container");
    if (!container) return;

    const description = leagueInfo
      ? leagueInfo.strDescriptionEN || leagueInfo.strDescription || ""
      : "";
    const descParagraphs = description
      ? description
          .split("\n")
          .filter((p) => p.trim())
          .map((p) => `<p>${escapeHTML(p)}</p>`)
          .join("")
      : "";

    container.innerHTML = `
      <h1 class="article-title" id="overview">${escapeHTML(leagueName)}</h1>

      <div class="article-layout">
        <div class="article-body">
          ${
            descParagraphs
              ? `
            <section class="league-description">
              ${descParagraphs}
            </section>
          `
              : ""
          }

          <section class="content-section" id="teams">
            <h2 class="section-heading">Teams (${teams.length})</h2>
            ${
              teams.length > 0
                ? `
              <div class="card-grid card-grid-small">
                ${teams
                  .map(
                    (t) => `
                  <a href="team.html?id=${t.idTeam}&name=${encodeURIComponent(t.strTeam)}" class="card">
                    <img src="${imgSrc(t.strBadge || t.strTeamBadge)}" alt="${escapeHTML(t.strTeam)}" loading="lazy">
                    <span class="card-title">${escapeHTML(t.strTeam)}</span>
                    <span class="card-subtitle">${escapeHTML(t.strStadium || "")}</span>
                  </a>
                `,
                  )
                  .join("")}
              </div>
            `
                : `
              <div class="empty-state">
                <div class="empty-icon">🏟️</div>
                <p>No teams found for this league.</p>
              </div>
            `
            }
          </section>
        </div>

        ${
          leagueInfo
            ? `
          <div class="infobox">
            <div class="infobox-header">${escapeHTML(leagueName)}</div>
            ${
              leagueInfo.strBadge || leagueInfo.strLogo
                ? `
              <div class="infobox-image">
                <img src="${imgSrc(leagueInfo.strBadge || leagueInfo.strLogo)}" alt="${escapeHTML(leagueName)}">
              </div>
            `
                : ""
            }
            <table>
              ${leagueInfo.strLeague ? `<tr><th>League</th><td>${escapeHTML(leagueInfo.strLeague)}</td></tr>` : ""}
              ${leagueInfo.strCountry ? `<tr><th>Country</th><td>${escapeHTML(leagueInfo.strCountry)}</td></tr>` : ""}
              ${leagueInfo.intFormedYear ? `<tr><th>Founded</th><td>${leagueInfo.intFormedYear}</td></tr>` : ""}
              ${leagueInfo.strGender ? `<tr><th>Gender</th><td>${escapeHTML(leagueInfo.strGender)}</td></tr>` : ""}
              <tr><th>Teams</th><td>${teams.length}</td></tr>
              ${leagueInfo.strWebsite ? `<tr><th>Website</th><td><a href="https://${leagueInfo.strWebsite}" target="_blank" rel="noopener">${escapeHTML(leagueInfo.strWebsite)}</a></td></tr>` : ""}
              ${leagueInfo.strNaming ? `<tr><th>Full Name</th><td>${escapeHTML(leagueInfo.strNaming)}</td></tr>` : ""}
              ${leagueInfo.strCurrentSeason ? `<tr><th>Current Season</th><td>${escapeHTML(leagueInfo.strCurrentSeason)}</td></tr>` : ""}
            </table>
            ${
              leagueInfo.strTrophy
                ? `
              <div class="infobox-image" style="border-top:1px solid var(--color-border-light)">
                <img src="${leagueInfo.strTrophy}" alt="Trophy" loading="lazy" style="max-height:120px">
              </div>
            `
                : ""
            }
            ${
              leagueInfo.strFanart1
                ? `
              <div class="infobox-image" style="border-top:1px solid var(--color-border-light)">
                <img src="${leagueInfo.strFanart1}" alt="${escapeHTML(leagueName)}" loading="lazy">
              </div>
            `
                : ""
            }
          </div>
        `
            : ""
        }
      </div>
    `;

    // Update sidebar TOC
    const toc = $("#sidebar-toc");
    if (toc) {
      toc.innerHTML = `
        <li><a href="#overview">Overview</a></li>
        <li><a href="#teams">Teams (${teams.length})</a></li>
      `;
    }
  }

  // ==============================================================
  //  INITIALIZATION — Router
  // ==============================================================

  document.addEventListener("DOMContentLoaded", () => {
    initSearch();
    initMobileMenu();

    const page = document.body.dataset.page;

    switch (page) {
      case "home":
        initHomePage();
        break;
      case "team":
        initTeamPage();
        break;
      case "player":
        initPlayerPage();
        break;
      case "league":
        initLeaguePage();
        break;
      default:
        // 404 or unknown — search still works
        break;
    }
  });
})();
