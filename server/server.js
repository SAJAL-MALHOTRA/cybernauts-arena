const express = require('express');
const cors = require('cors');
const tournamentService = require('./tournamentService');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins & parse JSON
app.use(cors({ origin: '*' }));
app.use(express.json());

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

// ====================================================
// CYBERNAUTS TOURNAMENT ENGINE REST APIS
// ====================================================

// Full Tournament State (Admin Console & Arena Screen)
app.get('/api/tournament/state', (req, res) => {
  res.json(tournamentService.getFullState());
});

// Single Team View (Desk Station)
app.get('/api/tournament/team/:teamId', (req, res) => {
  const view = tournamentService.getTeamView(req.params.teamId);
  if (!view) {
    return res.status(404).json({ error: 'Team not found.' });
  }
  res.json(view);
});

// Authenticate Team via PIN or Token
app.post('/api/tournament/auth-team', (req, res) => {
  const { teamId, pin, token } = req.body || {};
  const result = tournamentService.authenticateTeam(teamId, pin, token);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

// Push Question (phase: question_incoming)
app.post('/api/tournament/push-question', (req, res) => {
  const { questionId } = req.body || {};
  const result = tournamentService.pushQuestion(questionId);
  res.json(result);
});

// Start Master Timer (phase: active)
app.post('/api/tournament/start-timer', (req, res) => {
  const { duration } = req.body || {};
  const result = tournamentService.startTimer(duration);
  res.json(result);
});

// Push Question and Start Timer immediately
app.post('/api/tournament/push-and-start', (req, res) => {
  const { questionId, duration } = req.body || {};
  const result = tournamentService.pushAndStart(questionId, duration);
  res.json(result);
});

// Reveal Outcomes (phase: revealed)
app.post('/api/tournament/reveal-outcomes', (req, res) => {
  const result = tournamentService.revealOutcomes();
  res.json(result);
});

// Master Timer Actions: Pause, Resume, Add/Subtract Time, Stop
app.post('/api/tournament/timer-action', (req, res) => {
  const { action, seconds } = req.body || {};
  const timer = tournamentService.timerAction(action, seconds);
  res.json({ timer, phase: tournamentService.phase, serverTime: Date.now() });
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

// Advance to Next Stage (Round of 16 -> QF -> SF -> Finals -> Champion)
app.post('/api/tournament/advance-stage', (req, res) => {
  const result = tournamentService.advanceStage();
  res.json(result);
});

// Move to Round 2 (Quarterfinals) and Sync All Points from Round 1
app.post('/api/tournament/move-to-round-2', (req, res) => {
  const result = tournamentService.syncTournamentToRound2();
  res.json(result);
});

// Move to Semifinals (4 Teams Remaining) and Sync Points
app.post('/api/tournament/move-to-semifinals', (req, res) => {
  const result = tournamentService.syncTournamentToSemifinals();
  res.json(result);
});

// Sync Points Alias
app.post('/api/tournament/sync-points', (req, res) => {
  const result = tournamentService.syncTournamentToRound2();
  res.json(result);
});

// Force Declare Duel Winner (Admin Override)
app.post('/api/tournament/set-duel-winner', (req, res) => {
  const { duelId, winnerTeamId } = req.body || {};
  if (!duelId || !winnerTeamId) {
    return res.status(400).json({ error: 'Missing duelId or winnerTeamId.' });
  }
  const result = tournamentService.setDuelWinner(duelId, winnerTeamId);
  res.json(result);
});

// Reset Tournament
app.post('/api/tournament/reset', (req, res) => {
  const { reseed } = req.body || {};
  const result = tournamentService.resetTournament(reseed);
  res.json(result);
});

// Reset All Balances to 10,000 (Preserves team names and stage)
app.post('/api/tournament/reset-balances', (req, res) => {
  const { amount } = req.body || {};
  const result = tournamentService.resetBalances(amount || 10000);
  res.json(result);
});

// Update Single Team Details
app.post('/api/tournament/update-team', (req, res) => {
  const { teamId, name, members, color } = req.body || {};
  const result = tournamentService.updateTeam(teamId, { name, members, color });
  res.json(result);
});

// Batch Update Teams
app.post('/api/tournament/update-teams-batch', (req, res) => {
  const { teams } = req.body || {};
  const result = tournamentService.updateTeamsBatch(teams);
  res.json(result);
});

// Tournament Question Bank
app.get('/api/tournament/questions', (req, res) => {
  res.json({ count: tournamentService.questions.length, questions: tournamentService.questions });
});

// Tournament Duel Sets (15 Case Studies x 3 Questions)
app.get('/api/tournament/duel-sets', (req, res) => {
  res.json({ count: (tournamentService.duelSets || []).length, duelSets: tournamentService.duelSets || [] });
});

app.post('/api/tournament/questions', (req, res) => {
  const newQ = tournamentService.addQuestion(req.body);
  res.status(201).json(newQ);
});

app.put('/api/tournament/questions/:id', (req, res) => {
  const updated = tournamentService.updateQuestion(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Question not found.' });
  res.json(updated);
});

app.delete('/api/tournament/questions/:id', (req, res) => {
  const ok = tournamentService.deleteQuestion(req.params.id);
  res.json({ success: ok });
});

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 CYBERNAUTS ARENA TOURNAMENT ENGINE ONLINE`);
  console.log(`📡 Server listening on http://localhost:${PORT}`);
  console.log(`🎮 Stage: ${tournamentService.currentStage} | Phase: ${tournamentService.phase}`);
  console.log(`====================================================`);
});
