// Load .env if present (for local dev)
try { require('dotenv').config(); } catch (_) { /* dotenv optional */ }

const express = require('express');
const cors    = require('cors');
const tournamentService = require('./tournamentService');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────────────────────
// CORS — restrict in production, open in dev
// ─────────────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : null;

const corsOptions = {
  origin: allowedOrigins
    ? (origin, cb) => {
        // allow requests with no origin (curl, Postman, same-origin)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      }
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-key']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight for all routes
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// Admin auth middleware
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'cybernauts2026';

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || (req.body && req.body._adminKey);
  if (!key || key !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: 'Admin authentication required.', hint: 'Send the admin passcode in the x-admin-key header.' });
  }
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS (no auth needed)
// ─────────────────────────────────────────────────────────────────────────────

// System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    tournament: 'CYBERNAUTS ARENA',
    stage: tournamentService.currentStage,
    phase: tournamentService.phase,
    timestamp: Date.now()
  });
});

// Full Tournament State — presence is embedded in this payload (admin reads it)
app.get('/api/tournament/state', (req, res) => {
  res.json(tournamentService.getFullState());
});

// Single Team View (Desk Station)
app.get('/api/tournament/team/:teamId', (req, res) => {
  const view = tournamentService.getTeamView(req.params.teamId);
  if (!view) return res.status(404).json({ error: 'Team not found.' });
  res.json(view);
});

// Authenticate Team via PIN or Token
app.post('/api/tournament/auth-team', (req, res) => {
  const { teamId, pin, token } = req.body || {};
  const result = tournamentService.authenticateTeam(teamId, pin, token);
  if (!result.success) return res.status(401).json(result);
  res.json(result);
});

// Team desk heartbeat — fire-and-forget, no auth required beyond token check
app.post('/api/tournament/heartbeat', (req, res) => {
  const { teamId, token } = req.body || {};
  if (!teamId) return res.status(400).json({ error: 'Missing teamId.' });
  // Soft auth — verify token matches (prevents spam from random clients)
  const team = tournamentService.teams.find((t) => t.id === teamId);
  if (!team || (token && team.token !== token)) {
    return res.status(401).json({ error: 'Invalid team credentials.' });
  }
  tournamentService.heartbeat(teamId);
  res.json({ ok: true });
});

// Participant Team Submits Answer (requires PIN or Token)
app.post('/api/tournament/submit-answer', (req, res) => {
  let { teamId, duelId, optionIndex, token, pin } = req.body || {};
  if (!teamId || optionIndex === undefined) {
    return res.status(400).json({ error: 'Missing teamId or optionIndex.' });
  }
  if (!duelId) {
    const activeDuels = tournamentService.getActiveStageDuels();
    const found = activeDuels.find((d) => (d.teamA && d.teamA.id === teamId) || (d.teamB && d.teamB.id === teamId));
    if (found) duelId = found.id;
  }
  const tokenOrPin = token || pin;
  const result = tournamentService.submitAnswer(teamId, duelId, optionIndex, tokenOrPin);
  if (!result.success && result.message && result.message.includes('Authentication failed')) {
    return res.status(401).json(result);
  }
  res.json(result);
});

// Question bank — public so bracket screen can display counts
app.get('/api/tournament/questions', (req, res) => {
  res.json({ count: tournamentService.questions.length, questions: tournamentService.questions });
});

// Duel Sets — public
app.get('/api/tournament/duel-sets', (req, res) => {
  res.json({ count: (tournamentService.duelSets || []).length, duelSets: tournamentService.duelSets || [] });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN-ONLY ENDPOINTS  (all require x-admin-key header)
// ─────────────────────────────────────────────────────────────────────────────

// Host Sheet — all 16 teams with PIN + token (print before event)
app.get('/api/tournament/host-sheet', requireAdmin, (req, res) => {
  res.json({ generatedAt: new Date().toISOString(), teams: tournamentService.getHostSheet() });
});

// Desk Presence — live/stale/offline per team
app.get('/api/tournament/presence', requireAdmin, (req, res) => {
  res.json({ presence: tournamentService.getPresence(), serverTime: Date.now() });
});

// Push Question (phase: question_incoming)
app.post('/api/tournament/push-question', requireAdmin, (req, res) => {
  const { questionId } = req.body || {};
  res.json(tournamentService.pushQuestion(questionId));
});

// Start Master Timer (phase: active)
app.post('/api/tournament/start-timer', requireAdmin, (req, res) => {
  const { duration } = req.body || {};
  res.json(tournamentService.startTimer(duration));
});

// Push Question and Start Timer immediately
app.post('/api/tournament/push-and-start', requireAdmin, (req, res) => {
  const { questionId, duration } = req.body || {};
  res.json(tournamentService.pushAndStart(questionId, duration));
});

// Reveal Outcomes (phase: revealed)
app.post('/api/tournament/reveal-outcomes', requireAdmin, (req, res) => {
  res.json(tournamentService.revealOutcomes());
});

// Master Timer Actions: Pause, Resume, Add/Subtract Time, Stop
app.post('/api/tournament/timer-action', requireAdmin, (req, res) => {
  const { action, seconds } = req.body || {};
  const timer = tournamentService.timerAction(action, seconds);
  res.json({ timer, phase: tournamentService.phase, serverTime: Date.now() });
});

// Advance to Next Stage
app.post('/api/tournament/advance-stage', requireAdmin, (req, res) => {
  res.json(tournamentService.advanceStage());
});

// Move to Round 2 (Quarterfinals) and Sync Points
app.post('/api/tournament/move-to-round-2', requireAdmin, (req, res) => {
  res.json(tournamentService.syncTournamentToRound2());
});

// Move to Semifinals (4 Teams Remaining) and Sync Points
app.post('/api/tournament/move-to-semifinals', requireAdmin, (req, res) => {
  res.json(tournamentService.syncTournamentToSemifinals());
});

// Sync Points Alias
app.post('/api/tournament/sync-points', requireAdmin, (req, res) => {
  res.json(tournamentService.syncTournamentToRound2());
});

// Force Declare Duel Winner (Admin Override)
app.post('/api/tournament/set-duel-winner', requireAdmin, (req, res) => {
  const { duelId, winnerTeamId } = req.body || {};
  if (!duelId || !winnerTeamId) return res.status(400).json({ error: 'Missing duelId or winnerTeamId.' });
  res.json(tournamentService.setDuelWinner(duelId, winnerTeamId));
});

// Reset Tournament (generates new PINs — print host sheet after)
app.post('/api/tournament/reset', requireAdmin, (req, res) => {
  const { reseed } = req.body || {};
  res.json(tournamentService.resetTournament(reseed));
});

// Rotate PINs only (mid-event use — doesn't touch bracket or scores)
app.post('/api/tournament/rotate-pins', requireAdmin, (req, res) => {
  const { teamIds } = req.body || {};
  res.json(tournamentService.rotatePins(teamIds || null));
});

// Reset All Balances
app.post('/api/tournament/reset-balances', requireAdmin, (req, res) => {
  const { amount } = req.body || {};
  res.json(tournamentService.resetBalances(amount || 10000));
});

// Update Single Team Details
app.post('/api/tournament/update-team', requireAdmin, (req, res) => {
  const { teamId, name, members, color, pin, credits, multiplier } = req.body || {};
  res.json(tournamentService.updateTeam(teamId, { name, members, color, pin, credits, multiplier }));
});

// Batch Update Teams
app.post('/api/tournament/update-teams-batch', requireAdmin, (req, res) => {
  const { teams } = req.body || {};
  res.json(tournamentService.updateTeamsBatch(teams));
});

// Question Bank CRUD
app.post('/api/tournament/questions', requireAdmin, (req, res) => {
  res.status(201).json(tournamentService.addQuestion(req.body));
});
app.put('/api/tournament/questions/:id', requireAdmin, (req, res) => {
  const updated = tournamentService.updateQuestion(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Question not found.' });
  res.json(updated);
});
app.delete('/api/tournament/questions/:id', requireAdmin, (req, res) => {
  res.json({ success: tournamentService.deleteQuestion(req.params.id) });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('🚀 CYBERNAUTS ARENA TOURNAMENT ENGINE ONLINE');
  console.log(`📡 Listening on http://0.0.0.0:${PORT}`);
  console.log(`🎮 Stage: ${tournamentService.currentStage} | Phase: ${tournamentService.phase}`);
  console.log(`🔐 Admin passcode: ${ADMIN_PASSCODE === 'cybernauts2026' ? '(default — set ADMIN_PASSCODE env var before event)' : '(custom ✓)'}`);
  if (allowedOrigins) {
    console.log(`🌐 CORS origins: ${allowedOrigins.join(', ')}`);
  } else {
    console.log('🌐 CORS: open (set ALLOWED_ORIGINS env var before event)');
  }
  console.log('====================================================');
});
