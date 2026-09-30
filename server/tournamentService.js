const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────
// Secret generation — called on every reset, never hardcoded
// ─────────────────────────────────────────────────────────────
const TRIVIAL_PINS = new Set(['0000','1111','2222','3333','4444','5555','6666','7777','8888','9999','1234','4321','0123','1230']);

function generatePin(usedPins = new Set()) {
  let pin;
  let attempts = 0;
  do {
    // 4 digits, first digit 1-9 to avoid leading zero confusion
    const first = Math.floor(Math.random() * 9) + 1;
    const rest  = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    pin = `${first}${rest}`;
    attempts++;
    if (attempts > 200) break; // safety valve — can't infinite loop
  } while (usedPins.has(pin) || TRIVIAL_PINS.has(pin));
  usedPins.add(pin);
  return pin;
}

function generateToken(teamId) {
  const hex = crypto.randomBytes(6).toString('hex');
  return `tok_${teamId.toLowerCase()}_${hex}`;
}

// Team template — no secrets committed. PINs/tokens are generated at runtime.
const DEFAULT_TEAMS = [
  { id: 'T01', name: 'DEBUGGERS',       pin: '0000', token: '', credits: 10000, multiplier: 1.1, seed: 1,  members: 'Table 1',  color: '#38bdf8' },
  { id: 'T02', name: 'TRIBYTES',        pin: '0000', token: '', credits: 10000, multiplier: 1.0, seed: 16, members: 'Table 2',  color: '#f43f5e' },
  { id: 'T03', name: 'HACK3RS',         pin: '0000', token: '', credits: 10000, multiplier: 1.1, seed: 2,  members: 'Table 3',  color: '#a855f7' },
  { id: 'T04', name: '404',             pin: '0000', token: '', credits: 10000, multiplier: 1.0, seed: 15, members: 'Table 4',  color: '#22c55e' },
  { id: 'T05', name: 'OLIPHANS',        pin: '0000', token: '', credits: 10000, multiplier: 1.1, seed: 3,  members: 'Table 5',  color: '#eab308' },
  { id: 'T06', name: 'STACK OVERLOADS', pin: '0000', token: '', credits: 10000, multiplier: 1.0, seed: 14, members: 'Table 6',  color: '#ec4899' },
  { id: 'T07', name: 'CODEHUB',         pin: '0000', token: '', credits: 10000, multiplier: 1.1, seed: 4,  members: 'Table 7',  color: '#06b6d4' },
  { id: 'T08', name: 'ERROR 404',       pin: '0000', token: '', credits: 10000, multiplier: 1.0, seed: 13, members: 'Table 8',  color: '#f97316' },
  { id: 'T09', name: 'TEAM DIAMOND',    pin: '0000', token: '', credits: 10000, multiplier: 1.1, seed: 5,  members: 'Table 9',  color: '#84cc16' },
  { id: 'T10', name: 'CODEFLIX',        pin: '0000', token: '', credits: 10000, multiplier: 1.0, seed: 12, members: 'Table 10', color: '#14b8a6' },
  { id: 'T11', name: 'XSCAVENGERS',     pin: '0000', token: '', credits: 10000, multiplier: 1.0, seed: 6,  members: 'Table 11', color: '#6366f1' },
  { id: 'T12', name: 'PACKET PREDATORS',pin: '0000', token: '', credits: 10000, multiplier: 1.0, seed: 11, members: 'Table 12', color: '#d946ef' },
  { id: 'T13', name: 'NULLCORE',        pin: '0000', token: '', credits: 10000, multiplier: 1.0, seed: 7,  members: 'Table 13', color: '#10b981' },
  { id: 'T14', name: 'BINARY BRAIN',    pin: '0000', token: '', credits: 10000, multiplier: 1.0, seed: 10, members: 'Table 14', color: '#fb7185' },
  { id: 'T15', name: 'VOID CODE',       pin: '0000', token: '', credits: 10000, multiplier: 1.0, seed: 8,  members: 'Table 15', color: '#3b82f6' },
  { id: 'T16', name: 'BUG HUNTERS',     pin: '0000', token: '', credits: 10000, multiplier: 1.0, seed: 9,  members: 'Table 16', color: '#e11d48' },
];

const CREDIT_CHANGES = {
  best: 3000,      // Best answer: +3,000
  less_good: 1500, // Less-good answer: +1,500
  neutral: 0,      // Neutral answer: 0
  less_bad: -2000, // Less-bad answer: -2,000
  worst: -4000     // Worst answer: -4,000
};

const { ALL_QUESTIONS, DUEL_SETS } = require('./tournamentQuestions');

class TournamentService {
  constructor() {
    this.teams = JSON.parse(JSON.stringify(DEFAULT_TEAMS));
    this.questions = JSON.parse(JSON.stringify(ALL_QUESTIONS));
    this.duelSets = JSON.parse(JSON.stringify(DUEL_SETS));
    this.stages = ['round_of_16', 'quarterfinals', 'semifinals', 'finals', 'champion'];
    this.currentStage = 'round_of_16';
    this.champion = null;

    // Authoritative Workflow Phase:
    // 'idle' | 'question_incoming' | 'active' | 'locked' | 'revealed'
    this.phase = 'idle';

    // Synchronized Master Clock
    this.timer = {
      status: 'idle', // 'idle' | 'running' | 'paused' | 'expired'
      duration: 30,   // default 30 seconds (Official Rulebook)
      startedAt: null,
      deadline: null,
      pausedAt: null,
      remainingSeconds: 30
    };

    this.activeQuestion = null;
    this.currentQuestionIndex = 0;
    this.bracket = {
      round_of_16: [],
      quarterfinals: [],
      semifinals: [],
      finals: []
    };

    this.timerInterval = null;
    this.stateFilePath = path.join(__dirname, 'tournament_state.json');

    // Desk presence — in-memory only, not persisted to disk
    // { [teamId]: { lastSeen: number } }
    this.presence = {};

    const loaded = this.loadState();
    if (!loaded) {
      this.initBracket();
      // Generate fresh secrets on first boot with no saved state
      const usedPins = new Set();
      this.teams.forEach((t) => {
        t.pin   = generatePin(usedPins);
        t.token = generateToken(t.id);
      });
      this.saveState();
    }
    this.startServerTimerLoop();
  }

  initBracket() {
    this.bracket.round_of_16 = [];
    for (let i = 0; i < 8; i++) {
      const teamA = this.teams[i * 2] || null;
      const teamB = this.teams[i * 2 + 1] || null;
      this.bracket.round_of_16.push(this.createDuel(`R16-D${i + 1}`, 'round_of_16', i + 1, teamA, teamB));
    }

    this.bracket.quarterfinals = [];
    for (let i = 0; i < 4; i++) {
      this.bracket.quarterfinals.push(this.createDuel(`QF-D${i + 1}`, 'quarterfinals', i + 1, null, null));
    }

    this.bracket.semifinals = [];
    for (let i = 0; i < 2; i++) {
      this.bracket.semifinals.push(this.createDuel(`SF-D${i + 1}`, 'semifinals', i + 1, null, null));
    }

    this.bracket.finals = [this.createDuel('F-D1', 'finals', 1, null, null)];
    this.champion = null;
    this.currentStage = 'round_of_16';
    this.phase = 'idle';
  }

  saveState() {
    try {
      const state = {
        savedAt: new Date().toISOString(),
        currentStage: this.currentStage,
        phase: this.phase,
        champion: this.champion,
        currentQuestionIndex: this.currentQuestionIndex,
        roundId: this.roundId || 1,
        activeQuestion: this.activeQuestion,
        teams: this.teams,
        bracket: this.bracket
      };
      fs.writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Tournament] Failed to save state to disk:', err.message);
    }
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const raw = fs.readFileSync(this.stateFilePath, 'utf-8');
        const state = JSON.parse(raw);
        if (state && state.bracket && state.teams && state.currentStage) {
          this.teams = state.teams;
          this.currentStage = state.currentStage;
          this.champion = state.champion || null;
          this.phase = 'idle'; // Reset to idle so timers do not hang upon server restart
          this.bracket = state.bracket;
          this.currentQuestionIndex = state.currentQuestionIndex || 0;
          this.roundId = state.roundId || 1;
          this.activeQuestion = state.activeQuestion || null;
          console.log(`[Tournament] Successfully loaded state from disk! Stage: ${this.currentStage}`);
          return true;
        }
      }
    } catch (err) {
      console.error('[Tournament] Failed to load state from disk:', err.message);
    }
    return false;
  }

  syncTournamentToRound2() {
    console.log('[Tournament] Executing syncTournamentToRound2...');

    const round1Results = {
      T01: { credits: 12600 },
      T02: { credits: 26500 },
      T03: { credits: 29800 },
      T04: { credits: 12500 },
      T05: { credits: 17550 },
      T06: { credits: 14000 },
      T07: { credits: 28150 },
      T08: { credits: 16000 },
      T09: { credits: 24500 },
      T10: { credits: 10500 },
      T11: { credits: 0 },
      T12: { credits: 21000 },
      T13: { credits: 14500 },
      T14: { credits: 26500 },
      T15: { credits: 4000 },
      T16: { credits: 16500 }
    };

    // Update master teams array
    this.teams.forEach((t) => {
      if (round1Results[t.id]) {
        t.credits = round1Results[t.id].credits;
      }
    });

    const getT = (id) => this.teams.find((t) => t.id === id);

    // Build Round of 16 completed duels with exact verified scores and winners
    this.bracket.round_of_16 = [
      {
        id: 'R16-D1', stage: 'round_of_16', duelNumber: 1,
        teamA: { ...getT('T01') }, teamB: { ...getT('T02') },
        creditsA: 12600, creditsB: 26500, roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 3, totalQuestions: 3,
        winner: { ...getT('T02') }, status: 'completed',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      },
      {
        id: 'R16-D2', stage: 'round_of_16', duelNumber: 2,
        teamA: { ...getT('T03') }, teamB: { ...getT('T04') },
        creditsA: 29800, creditsB: 12500, roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 3, totalQuestions: 3,
        winner: { ...getT('T03') }, status: 'completed',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      },
      {
        id: 'R16-D3', stage: 'round_of_16', duelNumber: 3,
        teamA: { ...getT('T05') }, teamB: { ...getT('T06') },
        creditsA: 17550, creditsB: 14000, roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 3, totalQuestions: 3,
        winner: { ...getT('T05') }, status: 'completed',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      },
      {
        id: 'R16-D4', stage: 'round_of_16', duelNumber: 4,
        teamA: { ...getT('T07') }, teamB: { ...getT('T08') },
        creditsA: 28150, creditsB: 16000, roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 3, totalQuestions: 3,
        winner: { ...getT('T07') }, status: 'completed',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      },
      {
        id: 'R16-D5', stage: 'round_of_16', duelNumber: 5,
        teamA: { ...getT('T09') }, teamB: { ...getT('T10') },
        creditsA: 24500, creditsB: 10500, roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 3, totalQuestions: 3,
        winner: { ...getT('T09') }, status: 'completed',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      },
      {
        id: 'R16-D6', stage: 'round_of_16', duelNumber: 6,
        teamA: { ...getT('T11') }, teamB: { ...getT('T12') },
        creditsA: 0, creditsB: 21000, roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 3, totalQuestions: 3,
        winner: { ...getT('T12') }, status: 'completed',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      },
      {
        id: 'R16-D7', stage: 'round_of_16', duelNumber: 7,
        teamA: { ...getT('T13') }, teamB: { ...getT('T14') },
        creditsA: 14500, creditsB: 26500, roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 3, totalQuestions: 3,
        winner: { ...getT('T14') }, status: 'completed',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      },
      {
        id: 'R16-D8', stage: 'round_of_16', duelNumber: 8,
        teamA: { ...getT('T15') }, teamB: { ...getT('T16') },
        creditsA: 4000, creditsB: 16500, roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 3, totalQuestions: 3,
        winner: { ...getT('T16') }, status: 'completed',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      }
    ];

    // Build Quarterfinals (Round 2) duels with 8 winners and carried-over credits
    this.bracket.quarterfinals = [
      {
        id: 'QF-D1', stage: 'quarterfinals', duelNumber: 1,
        teamA: { ...getT('T02') }, teamB: { ...getT('T03') },
        creditsA: 26500, creditsB: 29800, roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 0, totalQuestions: 3,
        winner: null, status: 'pending',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      },
      {
        id: 'QF-D2', stage: 'quarterfinals', duelNumber: 2,
        teamA: { ...getT('T05') }, teamB: { ...getT('T07') },
        creditsA: 17550, creditsB: 28150, roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 0, totalQuestions: 3,
        winner: null, status: 'pending',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      },
      {
        id: 'QF-D3', stage: 'quarterfinals', duelNumber: 3,
        teamA: { ...getT('T09') }, teamB: { ...getT('T12') },
        creditsA: 24500, creditsB: 21000, roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 0, totalQuestions: 3,
        winner: null, status: 'pending',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      },
      {
        id: 'QF-D4', stage: 'quarterfinals', duelNumber: 4,
        teamA: { ...getT('T14') }, teamB: { ...getT('T16') },
        creditsA: 26500, creditsB: 16500, roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 0, totalQuestions: 3,
        winner: null, status: 'pending',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      }
    ];

    // Reset Semifinals and Finals as pending
    this.bracket.semifinals = [
      this.createDuel('SF-D1', 'semifinals', 1, null, null),
      this.createDuel('SF-D2', 'semifinals', 2, null, null)
    ];
    this.bracket.finals = [
      this.createDuel('F-D1', 'finals', 1, null, null)
    ];

    this.currentStage = 'quarterfinals';
    this.champion = null;
    this.phase = 'idle';
    this.timer = {
      status: 'idle',
      duration: 30,
      startedAt: null,
      deadline: null,
      pausedAt: null,
      remainingSeconds: 30
    };
    this.activeQuestion = null;

    this.saveState();
    return {
      success: true,
      currentStage: this.currentStage,
      message: 'Moved to Round 2 (Quarterfinals). All 8 quarterfinalist points synced successfully!'
    };
  }

  syncTournamentToSemifinals() {
    console.log('[Tournament] Executing syncTournamentToSemifinals (4 Teams Remaining)...');

    const getT = (id) => this.teams.find((t) => t.id === id);

    // Build Semifinals (Round 3) with the 4 qualified teams
    this.bracket.semifinals = [
      {
        id: 'SF-D1', stage: 'semifinals', duelNumber: 1,
        teamA: { ...getT('T03') }, // HACK3RS
        teamB: { ...getT('T07') }, // CODEHUB
        creditsA: typeof getT('T03')?.credits === 'number' ? getT('T03').credits : 29800,
        creditsB: typeof getT('T07')?.credits === 'number' ? getT('T07').credits : 28150,
        roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 0, totalQuestions: 3,
        winner: null, status: 'pending',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      },
      {
        id: 'SF-D2', stage: 'semifinals', duelNumber: 2,
        teamA: { ...getT('T09') }, // TEAM DIAMOND
        teamB: { ...getT('T14') }, // BINARY BRAIN
        creditsA: typeof getT('T09')?.credits === 'number' ? getT('T09').credits : 24500,
        creditsB: typeof getT('T14')?.credits === 'number' ? getT('T14').credits : 26500,
        roundDeltaA: 0, roundDeltaB: 0,
        questionsAnswered: 0, totalQuestions: 3,
        winner: null, status: 'pending',
        currentRoundSubmissions: { teamA: null, teamB: null }, history: []
      }
    ];

    // Reset Finals as pending
    this.bracket.finals = [
      this.createDuel('F-D1', 'finals', 1, null, null)
    ];

    this.currentStage = 'semifinals';
    this.champion = null;
    this.phase = 'idle';
    this.timer = {
      status: 'idle',
      duration: 45,
      startedAt: null,
      deadline: null,
      pausedAt: null,
      remainingSeconds: 45
    };
    this.activeQuestion = null;

    this.saveState();
    return {
      success: true,
      currentStage: this.currentStage,
      message: 'Moved to Semifinals (4 Teams Remaining: HACK3RS, CODEHUB, TEAM DIAMOND, BINARY BRAIN).'
    };
  }

  createDuel(id, stage, duelNumber, teamA, teamB) {
    return {
      id,
      stage,
      duelNumber,
      teamA: teamA ? { id: teamA.id, name: teamA.name, credits: teamA.credits, multiplier: teamA.multiplier || 1.0, color: teamA.color } : null,
      teamB: teamB ? { id: teamB.id, name: teamB.name, credits: teamB.credits, multiplier: teamB.multiplier || 1.0, color: teamB.color } : null,
      creditsA: teamA ? teamA.credits : 10000,
      creditsB: teamB ? teamB.credits : 10000,
      roundDeltaA: 0,
      roundDeltaB: 0,
      questionsAnswered: 0,
      totalQuestions: 3,
      winner: null,
      status: 'pending', // 'pending' | 'in_progress' | 'round_evaluated' | 'completed'
      currentRoundSubmissions: {
        teamA: null, // { optionIndex, outcome, creditChange, timeTaken, submittedAt }
        teamB: null
      },
      history: []
    };
  }

  // Authenticate team with PIN or Token
  authenticateTeam(teamId, pin, token) {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) {
      return { success: false, message: 'Team ID does not exist.' };
    }

    if (token && team.token === token) {
      return { success: true, teamId: team.id, token: team.token, teamName: team.name };
    }

    if (pin && String(team.pin) === String(pin).trim()) {
      return { success: true, teamId: team.id, token: team.token, teamName: team.name };
    }

    return { success: false, message: 'Invalid 4-digit PIN for this team.' };
  }

  // Server background clock
  startServerTimerLoop() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.timer.status === 'running') {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((this.timer.deadline - now) / 1000));
        this.timer.remainingSeconds = remaining;

        if (now >= this.timer.deadline) {
          this.timer.status = 'expired';
          this.timer.remainingSeconds = 0;
          this.onTimerExpired();
        }
      }
    }, 250);
  }

  onTimerExpired() {
    console.log(`[Tournament] Timer Expired for stage: ${this.currentStage}`);
    this.phase = 'locked';

    const activeDuels = this.getActiveStageDuels();
    activeDuels.forEach((duel) => {
      if (duel.status === 'in_progress') {
        this.lockAndEvaluateDuel(duel);
      }
    });
  }

  getActiveStageDuels() {
    return this.bracket[this.currentStage] || [];
  }

  // Phase 1: Push Question (Auto-starts synchronized 30s master clock & activates question)
  pushQuestion(questionId = null, customDuration = 30) {
    let question = null;
    if (questionId) {
      question = this.questions.find((q) => q.id === Number(questionId));
    }
    if (!question) {
      question = this.questions[this.currentQuestionIndex % this.questions.length];
      this.currentQuestionIndex += 1;
    }

    this.roundId = (this.roundId || 0) + 1;
    this.activeQuestion = { ...question, roundId: this.roundId, pushedAt: Date.now() };

    const duration = customDuration ? Number(customDuration) : (this.timer.duration || 30);
    const now = Date.now();

    this.phase = 'active';
    this.timer = {
      status: 'running',
      duration,
      startedAt: now,
      deadline: now + duration * 1000,
      pausedAt: null,
      remainingSeconds: duration
    };

    const activeDuels = this.getActiveStageDuels();
    activeDuels.forEach((duel) => {
      duel.roundDeltaA = 0;
      duel.roundDeltaB = 0;
      duel.currentRoundSubmissions = { teamA: null, teamB: null };
      if (duel.teamA && duel.teamB && duel.status !== 'completed') {
        duel.status = 'in_progress';
      }
    });

    console.log(`[Tournament] Pushed Question #${question.id} (Round #${this.roundId}). Phase: active, Timer: ${duration}s`);
    this.saveState();
    return {
      phase: this.phase,
      timer: this.timer,
      activeQuestion: this.sanitizeQuestionForClients(this.activeQuestion),
      serverTime: now
    };
  }

  // Phase 2: Start Master Timer (State: active, 30s or 45s countdown)
  startTimer(customDuration = null) {
    if (!this.activeQuestion) {
      this.pushQuestion();
    }

    const duration = customDuration ? Number(customDuration) : (this.timer.duration || 30);
    const now = Date.now();

    this.phase = 'active';
    this.timer = {
      status: 'running',
      duration,
      startedAt: now,
      deadline: now + duration * 1000,
      pausedAt: null,
      remainingSeconds: duration
    };

    console.log(`[Tournament] Timer Started: ${duration}s. Phase: active`);
    return {
      phase: this.phase,
      timer: this.timer,
      serverTime: now
    };
  }

  // Combined: Push & Start immediately
  pushAndStart(questionId = null, customDuration = null) {
    this.pushQuestion(questionId);
    return this.startTimer(customDuration);
  }

  // Phase 3 & 4: Reveal Outcomes (State: revealed, credit deltas committed and revealed)
  revealOutcomes() {
    this.phase = 'revealed';
    const activeDuels = this.getActiveStageDuels();

    activeDuels.forEach((duel) => {
      if (duel.status === 'in_progress') {
        this.lockAndEvaluateDuel(duel);
      }
    });

    console.log(`[Tournament] Outcomes Revealed! Phase: revealed`);
    return {
      phase: this.phase,
      activeDuels: this.getActiveStageDuels(),
      serverTime: Date.now()
    };
  }

  // Master Clock Controls
  timerAction(action, seconds = 10) {
    const now = Date.now();

    if (action === 'pause') {
      if (this.timer.status === 'running') {
        this.timer.status = 'paused';
        this.timer.pausedAt = now;
        this.timer.remainingSeconds = Math.max(0, Math.ceil((this.timer.deadline - now) / 1000));
      }
    } else if (action === 'resume') {
      const rem = Math.max(10, this.timer.remainingSeconds || 10);
      this.timer.status = 'running';
      this.phase = 'active';
      this.timer.deadline = now + rem * 1000;
      this.timer.remainingSeconds = rem;
      this.timer.pausedAt = null;
    } else if (action === 'set_duration') {
      const dur = Number(seconds) || 30;
      this.timer.duration = dur;
      this.timer.remainingSeconds = dur;
    } else if (action === 'add_time') {
      const added = Number(seconds) || 10;
      if (this.timer.status === 'running') {
        this.timer.deadline += added * 1000;
        this.timer.remainingSeconds += added;
      } else {
        const rem = Math.max(added, (this.timer.remainingSeconds || 0) + added);
        this.timer.status = 'running';
        this.phase = 'active';
        this.timer.startedAt = now;
        this.timer.deadline = now + rem * 1000;
        this.timer.remainingSeconds = rem;
        this.timer.pausedAt = null;
      }
    } else if (action === 'sub_time') {
      const subbed = Number(seconds) || 10;
      if (this.timer.status === 'running') {
        this.timer.deadline = Math.max(now, this.timer.deadline - subbed * 1000);
        this.timer.remainingSeconds = Math.max(0, Math.ceil((this.timer.deadline - now) / 1000));
      } else {
        this.timer.remainingSeconds = Math.max(0, this.timer.remainingSeconds - subbed);
      }
    } else if (action === 'stop') {
      this.timer.status = 'expired';
      this.timer.remainingSeconds = 0;
      this.onTimerExpired();
    }

    this.saveState();
    return this.timer;
  }

  // Secure Answer Submission (verifies PIN/token)
  submitAnswer(teamId, duelId, optionIndex, tokenOrPin) {
    const auth = this.authenticateTeam(teamId, tokenOrPin, tokenOrPin);
    if (!auth.success) {
      return { success: false, message: 'Authentication failed. Invalid PIN or Token.' };
    }

    if (!this.activeQuestion) {
      return { success: false, message: 'No active problem statement currently running.' };
    }

    if (this.phase !== 'active' && this.timer.status !== 'running') {
      return { success: false, message: 'Answering is not currently active.' };
    }

    const now = Date.now();
    // Generous 2.5s network latency buffer
    if (this.timer.deadline && now > this.timer.deadline + 2500) {
      return { success: false, message: 'Time has expired for this question.' };
    }

    const activeDuels = this.getActiveStageDuels();
    let duel = activeDuels.find((d) => d.id === duelId);
    if (!duel) {
      duel = activeDuels.find((d) => (d.teamA && d.teamA.id === teamId) || (d.teamB && d.teamB.id === teamId));
    }
    if (!duel) {
      return { success: false, message: 'Duel not found in active stage.' };
    }

    const isTeamA = duel.teamA && duel.teamA.id === teamId;
    const isTeamB = duel.teamB && duel.teamB.id === teamId;
    if (!isTeamA && !isTeamB) {
      return { success: false, message: 'Team is not assigned to this duel.' };
    }

    const role = isTeamA ? 'teamA' : 'teamB';
    const existingSub = duel.currentRoundSubmissions[role];
    if (existingSub && this.activeQuestion && existingSub.questionId === this.activeQuestion.id) {
      return { success: false, message: 'Option has already been submitted and locked.' };
    }

    const optIdx = Number(optionIndex);
    const chosenOption = this.activeQuestion.options[optIdx];
    if (!chosenOption) {
      return { success: false, message: 'Invalid option selected.' };
    }

    const outcome = chosenOption.outcome;
    const baseChange = CREDIT_CHANGES[outcome] || 0;

    const teamObj = isTeamA ? duel.teamA : duel.teamB;
    const mult = (teamObj && teamObj.multiplier) || 1.0;
    const finalChange = baseChange > 0 ? Math.round(baseChange * mult) : baseChange;

    const timeTaken = Math.max(0.1, Number(((now - this.timer.startedAt) / 1000).toFixed(2)));

    duel.currentRoundSubmissions[role] = {
      teamId,
      roundId: this.roundId,
      questionId: this.activeQuestion ? this.activeQuestion.id : null,
      optionIndex: optIdx,
      outcome,
      creditChange: finalChange,
      timeTaken,
      submittedAt: now
    };

    console.log(`[Tournament] Team ${teamId} locked Option ${optIdx} in ${timeTaken}s (Outcome: ${outcome}, Delta: ${finalChange})`);

    // Check if both teams in this duel have answered
    if (duel.currentRoundSubmissions.teamA && duel.currentRoundSubmissions.teamB) {
      this.lockAndEvaluateDuel(duel);
    }

    return {
      success: true,
      timeTaken,
      message: 'Strategy option locked in.'
    };
  }

  // Evaluate single duel round
  lockAndEvaluateDuel(duel) {
    if (duel.status === 'completed') return;

    const subA = duel.currentRoundSubmissions.teamA;
    const subB = duel.currentRoundSubmissions.teamB;
    const q = this.activeQuestion;

    let changeA = subA ? subA.creditChange : -4000;
    let changeB = subB ? subB.creditChange : -4000;

    duel.roundDeltaA = changeA;
    duel.roundDeltaB = changeB;

    const curCreditsA = typeof duel.creditsA === 'number' ? duel.creditsA : 10000;
    const curCreditsB = typeof duel.creditsB === 'number' ? duel.creditsB : 10000;
    duel.creditsA = Math.max(0, curCreditsA + changeA);
    duel.creditsB = Math.max(0, curCreditsB + changeB);

    if (duel.teamA) duel.teamA.credits = duel.creditsA;
    if (duel.teamB) duel.teamB.credits = duel.creditsB;

    const masterA = this.teams.find((t) => t.id === duel.teamA?.id);
    if (masterA) masterA.credits = duel.creditsA;
    const masterB = this.teams.find((t) => t.id === duel.teamB?.id);
    if (masterB) masterB.credits = duel.creditsB;

    let winReason = '';
    let roundWinner = 'none';

    if (changeA > changeB) {
      roundWinner = 'teamA';
      winReason = `${duel.teamA.name} gained more credits (${changeA > 0 ? '+' : ''}${changeA} vs ${changeB > 0 ? '+' : ''}${changeB})!`;
    } else if (changeB > changeA) {
      roundWinner = 'teamB';
      winReason = `${duel.teamB.name} gained more credits (${changeB > 0 ? '+' : ''}${changeB} vs ${changeA > 0 ? '+' : ''}${changeA})!`;
    } else {
      if (subA && subB && subA.timeTaken < subB.timeTaken) {
        roundWinner = 'teamA';
        winReason = `Equal credits (${changeA}), but ${duel.teamA.name} was faster (${subA.timeTaken}s vs ${subB.timeTaken}s)!`;
      } else if (subA && subB && subB.timeTaken < subA.timeTaken) {
        roundWinner = 'teamB';
        winReason = `Equal credits (${changeB}), but ${duel.teamB.name} was faster (${subB.timeTaken}s vs ${subA.timeTaken}s)!`;
      } else {
        roundWinner = 'tie';
        winReason = `Both teams tied with ${changeA} credits!`;
      }
    }

    duel.questionsAnswered = (duel.questionsAnswered || 0) + 1;

    duel.history.push({
      questionNumber: duel.questionsAnswered,
      questionId: q ? q.id : null,
      questionTitle: q ? q.title : 'Duel Problem',
      caseStudy: q ? q.caseStudy : '',
      mission: q ? q.mission : '',
      subA: subA ? { ...subA } : null,
      subB: subB ? { ...subB } : null,
      changeA,
      changeB,
      creditsA: duel.creditsA,
      creditsB: duel.creditsB,
      roundWinner,
      winReason
    });

    // Check if 3 questions have completed for this duel
    if (duel.questionsAnswered >= (duel.totalQuestions || 3)) {
      duel.status = 'completed';
      if (duel.creditsA > duel.creditsB) {
        duel.winner = duel.teamA;
      } else if (duel.creditsB > duel.creditsA) {
        duel.winner = duel.teamB;
      } else {
        // Tie breaker by total speed across the 3 questions
        const totalTimeA = duel.history.reduce((sum, h) => sum + (h.subA ? h.subA.timeTaken : 30), 0);
        const totalTimeB = duel.history.reduce((sum, h) => sum + (h.subB ? h.subB.timeTaken : 30), 0);
        if (totalTimeA <= totalTimeB) {
          duel.winner = duel.teamA;
        } else {
          duel.winner = duel.teamB;
        }
      }
    } else {
      duel.status = 'round_evaluated';
      duel.winner = null;
    }
    this.saveState();
  }

  setDuelWinner(duelId, winnerTeamId) {
    const activeDuels = this.getActiveStageDuels();
    const duel = activeDuels.find((d) => d.id === duelId);
    if (!duel) return { success: false, message: 'Duel not found.' };

    if (duel.teamA && duel.teamA.id === winnerTeamId) {
      duel.winner = duel.teamA;
      duel.status = 'completed';
      this.saveState();
      return { success: true, duel };
    } else if (duel.teamB && duel.teamB.id === winnerTeamId) {
      duel.winner = duel.teamB;
      duel.status = 'completed';
      this.saveState();
      return { success: true, duel };
    }
    return { success: false, message: 'Team ID is not part of this duel.' };
  }

  advanceStage() {
    const currentDuels = this.getActiveStageDuels();
    const uncompleted = currentDuels.filter((d) => !d.winner);

    if (uncompleted.length > 0) {
      return {
        success: false,
        message: `Cannot advance stage. ${uncompleted.length} duel(s) do not have a declared winner yet.`
      };
    }

    const winners = currentDuels.map((d) => d.winner);

    if (this.currentStage === 'round_of_16') {
      for (let i = 0; i < 4; i++) {
        const qf = this.bracket.quarterfinals[i];
        qf.teamA = winners[i * 2] || null;
        qf.teamB = winners[i * 2 + 1] || null;
        qf.creditsA = typeof qf.teamA?.credits === 'number' ? qf.teamA.credits : 10000;
        qf.creditsB = typeof qf.teamB?.credits === 'number' ? qf.teamB.credits : 10000;
        qf.roundDeltaA = 0;
        qf.roundDeltaB = 0;
        qf.currentRoundSubmissions = { teamA: null, teamB: null };
        qf.questionsAnswered = 0;
        qf.totalQuestions = 3;
        qf.history = [];
        qf.status = 'pending';
        qf.winner = null;
      }
      this.currentStage = 'quarterfinals';
    } else if (this.currentStage === 'quarterfinals') {
      for (let i = 0; i < 2; i++) {
        const sf = this.bracket.semifinals[i];
        sf.teamA = winners[i * 2] || null;
        sf.teamB = winners[i * 2 + 1] || null;
        sf.creditsA = typeof sf.teamA?.credits === 'number' ? sf.teamA.credits : 10000;
        sf.creditsB = typeof sf.teamB?.credits === 'number' ? sf.teamB.credits : 10000;
        sf.roundDeltaA = 0;
        sf.roundDeltaB = 0;
        sf.currentRoundSubmissions = { teamA: null, teamB: null };
        sf.questionsAnswered = 0;
        sf.totalQuestions = 3;
        sf.history = [];
        sf.status = 'pending';
        sf.winner = null;
      }
      this.currentStage = 'semifinals';
    } else if (this.currentStage === 'semifinals') {
      const fn = this.bracket.finals[0];
      fn.teamA = winners[0] || null;
      fn.teamB = winners[1] || null;
      fn.creditsA = typeof fn.teamA?.credits === 'number' ? fn.teamA.credits : 10000;
      fn.creditsB = typeof fn.teamB?.credits === 'number' ? fn.teamB.credits : 10000;
      fn.roundDeltaA = 0;
      fn.roundDeltaB = 0;
      fn.currentRoundSubmissions = { teamA: null, teamB: null };
      fn.questionsAnswered = 0;
      fn.totalQuestions = 3;
      fn.history = [];
      fn.status = 'pending';
      fn.winner = null;
      this.currentStage = 'finals';
    } else if (this.currentStage === 'finals') {
      this.champion = winners[0] || null;
      this.currentStage = 'champion';
    }

    this.phase = 'idle';
    this.timer.status = 'idle';
    this.timer.remainingSeconds = this.timer.duration || 30;
    this.activeQuestion = null;
    this.saveState();

    return {
      success: true,
      currentStage: this.currentStage,
      winners,
      champion: this.champion
    };
  }

  resetTournament(reseed = false) {
    this.teams = JSON.parse(JSON.stringify(DEFAULT_TEAMS));
    // Generate fresh unique PINs and tokens — never use the placeholders from source
    const usedPins = new Set();
    this.teams.forEach((t) => {
      t.pin   = generatePin(usedPins);
      t.token = generateToken(t.id);
    });
    if (reseed) {
      this.teams.sort(() => Math.random() - 0.5);
    }
    this.initBracket();
    this.phase = 'idle';
    this.timer = {
      status: 'idle',
      duration: 30,
      startedAt: null,
      deadline: null,
      pausedAt: null,
      remainingSeconds: 30
    };
    this.activeQuestion = null;
    this.presence = {};
    this.saveState();
    console.log('[Tournament] Reset complete — new PINs generated for all 16 teams.');
    return { success: true, message: 'Tournament reset. New PINs generated — print the host sheet before distributing.', teams: this.teams };
  }

  // Rotate only PINs/tokens without touching bracket or scores.
  // Use mid-event if a team leaks their PIN.
  rotatePins(teamIds = null) {
    const usedPins = new Set(this.teams.map((t) => t.pin));
    const targets = teamIds
      ? this.teams.filter((t) => teamIds.includes(t.id))
      : this.teams;
    targets.forEach((t) => {
      usedPins.delete(t.pin); // remove old pin so it can be re-used if needed
      t.pin   = generatePin(usedPins);
      t.token = generateToken(t.id);
    });
    this.saveState();
    return { success: true, rotated: targets.map((t) => t.id), teams: this.teams };
  }

  resetBalances(toAmount = 10000) {
    const balance = Number(toAmount) || 10000;
    this.teams.forEach((t) => {
      t.credits = balance;
    });

    ['round_of_16', 'quarterfinals', 'semifinals', 'finals'].forEach((stageKey) => {
      (this.bracket[stageKey] || []).forEach((duel) => {
        duel.creditsA = balance;
        duel.creditsB = balance;
        duel.roundDeltaA = 0;
        duel.roundDeltaB = 0;
        duel.currentRoundSubmissions = { teamA: null, teamB: null };
        if (duel.teamA) duel.teamA.credits = balance;
        if (duel.teamB) duel.teamB.credits = balance;
      });
    });

    this.saveState();
    return { success: true, message: `All balances reset to ${balance.toLocaleString()} credits.` };
  }

  updateTeam(teamId, newDetails) {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false, message: 'Team not found.' };

    if (newDetails.name) team.name = newDetails.name;
    if (newDetails.members) team.members = newDetails.members;
    if (newDetails.color) team.color = newDetails.color;
    if (newDetails.pin) team.pin = String(newDetails.pin);
    if (newDetails.credits !== undefined) team.credits = Number(newDetails.credits);
    if (newDetails.multiplier !== undefined) team.multiplier = Number(newDetails.multiplier);

    ['round_of_16', 'quarterfinals', 'semifinals', 'finals'].forEach((stageKey) => {
      this.bracket[stageKey].forEach((duel) => {
        if (duel.teamA && duel.teamA.id === teamId) {
          duel.teamA.name = team.name;
          duel.teamA.credits = team.credits;
          duel.teamA.multiplier = team.multiplier;
          duel.creditsA = team.credits;
        }
        if (duel.teamB && duel.teamB.id === teamId) {
          duel.teamB.name = team.name;
          duel.teamB.credits = team.credits;
          duel.teamB.multiplier = team.multiplier;
          duel.creditsB = team.credits;
        }
      });
    });

    this.saveState();
    return { success: true, team };
  }

  updateTeamsBatch(teamsList) {
    if (!Array.isArray(teamsList)) return { success: false, message: 'Invalid teams payload.' };
    const updated = [];
    teamsList.forEach((item) => {
      if (item && item.id) {
        const res = this.updateTeam(item.id, item);
        if (res.success) updated.push(res.team);
      }
    });
    return { success: true, updatedCount: updated.length, teams: this.teams };
  }

  addQuestion(qData) {
    const newId = this.questions.length > 0 ? Math.max(...this.questions.map((q) => q.id)) + 1 : 1;
    const newQ = {
      id: newId,
      title: qData.title || `Duel Problem ${newId}`,
      category: qData.category || 'Algorithms',
      code: qData.code || '',
      question: qData.question || '',
      options: qData.options || [
        { text: 'Best Option', outcome: 'best' },
        { text: 'Less-Good Option', outcome: 'less_good' },
        { text: 'Neutral Option', outcome: 'neutral' },
        { text: 'Less-Bad Option', outcome: 'less_bad' },
        { text: 'Worst Option', outcome: 'worst' }
      ],
      explanation: qData.explanation || ''
    };
    this.questions.push(newQ);
    return newQ;
  }

  deleteQuestion(id) {
    const idx = this.questions.findIndex((item) => item.id === Number(id));
    if (idx !== -1) {
      this.questions.splice(idx, 1);
      return true;
    }
    return false;
  }

  sanitizeQuestionForClients(q) {
    if (!q) return null;
    const isRevealed = this.phase === 'revealed';
    return {
      id: q.id,
      roundId: q.roundId || this.roundId || 1,
      pushedAt: q.pushedAt || Date.now(),
      duelNumber: q.duelNumber || null,
      duelTitle: q.duelTitle || null,
      caseStudy: q.caseStudy || null,
      mission: q.mission || null,
      questionNumber: q.questionNumber || null,
      title: q.title,
      category: q.category,
      code: q.code || '',
      question: q.question,
      options: q.options.map((opt, idx) => ({
        index: idx,
        text: typeof opt === 'string' ? opt : opt.text,
        outcome: isRevealed ? (opt.outcome || 'neutral') : undefined,
        creditChange: isRevealed ? (CREDIT_CHANGES[opt.outcome] || 0) : undefined
      })),
      explanation: isRevealed ? q.explanation : undefined
    };
  }

  getTeamView(teamId) {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return null;

    const activeDuels = this.getActiveStageDuels();
    const currentDuel = activeDuels.find(
      (d) => (d.teamA && d.teamA.id === teamId) || (d.teamB && d.teamB.id === teamId)
    );

    let opponent = null;
    let myRole = null;
    let mySubmission = null;
    let opponentSubmissionStatus = 'thinking';

    if (currentDuel && currentDuel.currentRoundSubmissions) {
      const activeQId = this.activeQuestion ? this.activeQuestion.id : null;
      const isMatchingSub = (sub) => {
        if (!sub) return false;
        if (activeQId && sub.questionId && sub.questionId !== activeQId) return false;
        if (this.roundId && sub.roundId && sub.roundId !== this.roundId) return false;
        return true;
      };

      if (currentDuel.teamA && currentDuel.teamA.id === teamId) {
        myRole = 'teamA';
        opponent = currentDuel.teamB;
        const subA = currentDuel.currentRoundSubmissions.teamA;
        if (subA && isMatchingSub(subA)) {
          mySubmission = subA;
        }
        const subB = currentDuel.currentRoundSubmissions.teamB;
        if (subB && isMatchingSub(subB)) {
          opponentSubmissionStatus = 'locked_in';
        }
      } else if (currentDuel.teamB && currentDuel.teamB.id === teamId) {
        myRole = 'teamB';
        opponent = currentDuel.teamA;
        const subB = currentDuel.currentRoundSubmissions.teamB;
        if (subB && isMatchingSub(subB)) {
          mySubmission = subB;
        }
        const subA = currentDuel.currentRoundSubmissions.teamA;
        if (subA && isMatchingSub(subA)) {
          opponentSubmissionStatus = 'locked_in';
        }
      }
    }

    let stageStatus = 'active';
    if (!currentDuel) {
      const wasEliminated = ['round_of_16', 'quarterfinals', 'semifinals', 'finals'].some((stKey) => {
        return this.bracket[stKey].some((d) => {
          const inDuel = (d.teamA && d.teamA.id === teamId) || (d.teamB && d.teamB.id === teamId);
          return inDuel && d.winner && d.winner.id !== teamId;
        });
      });
      stageStatus = wasEliminated ? 'eliminated' : 'waiting';
    } else if (currentDuel.winner) {
      stageStatus = currentDuel.winner.id === teamId ? 'advanced' : 'eliminated';
    }

    const myDelta = currentDuel ? (myRole === 'teamA' ? (currentDuel.roundDeltaA || 0) : (currentDuel.roundDeltaB || 0)) : 0;
    const oppDelta = currentDuel ? (myRole === 'teamA' ? (currentDuel.roundDeltaB || 0) : (currentDuel.roundDeltaA || 0)) : 0;
    const rawMyCredits = currentDuel ? (myRole === 'teamA' ? currentDuel.creditsA : currentDuel.creditsB) : team.credits;
    const rawOppCredits = currentDuel && opponent ? (myRole === 'teamA' ? currentDuel.creditsB : currentDuel.creditsA) : (opponent ? opponent.credits : 10000);

    const displayMyCredits = this.phase === 'revealed' ? rawMyCredits : (rawMyCredits - myDelta);
    const displayOppCredits = this.phase === 'revealed' ? rawOppCredits : (rawOppCredits - oppDelta);

    return {
      team: {
        id: team.id,
        name: team.name,
        color: team.color,
        credits: displayMyCredits
      },
      currentStage: this.currentStage,
      phase: this.phase, // 'idle' | 'question_incoming' | 'active' | 'locked' | 'revealed'
      stageStatus,
      duel: currentDuel ? {
        id: currentDuel.id,
        duelNumber: currentDuel.duelNumber,
        myCredits: displayMyCredits,
        opponentCredits: displayOppCredits,
        myRoundDelta: this.phase === 'revealed' ? myDelta : 0,
        opponentRoundDelta: this.phase === 'revealed' ? oppDelta : 0,
        questionsAnswered: currentDuel.questionsAnswered || 0,
        totalQuestions: currentDuel.totalQuestions || 3,
        status: currentDuel.status,
        winner: currentDuel.winner,
        history: currentDuel.history
      } : null,
      opponent: opponent ? {
        id: opponent.id,
        name: opponent.name,
        color: opponent.color,
        credits: displayOppCredits
      } : null,
      mySubmission: mySubmission ? {
        optionIndex: mySubmission.optionIndex,
        timeTaken: mySubmission.timeTaken,
        // Only show outcome and credit change when revealed
        outcome: this.phase === 'revealed' ? mySubmission.outcome : undefined,
        creditChange: this.phase === 'revealed' ? mySubmission.creditChange : undefined
      } : null,
      opponentSubmissionStatus,
      activeQuestion: this.sanitizeQuestionForClients(this.activeQuestion),
      timer: this.timer,
      serverTime: Date.now()
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // Desk Presence
  // ──────────────────────────────────────────────────────────────────

  // Called by team desk on every poll tick (fire-and-forget)
  heartbeat(teamId) {
    if (!teamId) return;
    this.presence[teamId] = { lastSeen: Date.now() };
  }

  // Returns presence status for all known teams
  // live  < 4 s since last heartbeat
  // stale < 15 s
  // offline otherwise
  getPresence() {
    const now = Date.now();
    return this.teams.map((t) => {
      const rec = this.presence[t.id];
      const age = rec ? (now - rec.lastSeen) / 1000 : Infinity;
      const status = age < 4 ? 'live' : age < 15 ? 'stale' : 'offline';
      return { id: t.id, name: t.name, color: t.color, status, lastSeenAgo: isFinite(age) ? Math.round(age) : null };
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // Host Sheet — admin-only, returns everything needed to print the
  // credential handout before the event starts
  // ──────────────────────────────────────────────────────────────────
  getHostSheet() {
    return this.teams.map((t) => ({
      id:      t.id,
      name:    t.name,
      members: t.members,
      seed:    t.seed,
      pin:     t.pin,
      token:   t.token,
      color:   t.color
    }));
  }

  // Full state for public consumption (used by /bracket, /admin poll, /team poll)
  // IMPORTANT: strip PIN and token — those are only served via admin-only /host-sheet
  getFullState() {
    const safeTeams = this.teams.map(({ pin, token, ...rest }) => rest); // eslint-disable-line no-unused-vars
    return {
      tournamentName: 'CYBERNAUTS CODE HUNT — ROUND 2 (Championship Duels)',
      currentStage: this.currentStage,
      stages: this.stages,
      phase: this.phase,
      creditRules: CREDIT_CHANGES,
      startingCredits: 10000,
      teams: safeTeams, // PINs and tokens NOT included — use /host-sheet for those
      bracket: this.bracket,
      activeDuels: this.getActiveStageDuels(),
      timer: this.timer,
      activeQuestion: this.activeQuestion,
      questionsCount: this.questions.length,
      champion: this.champion,
      presence: this.getPresence(),
      serverTime: Date.now()
    };
  }
}

const tournamentService = new TournamentService();
module.exports = tournamentService;
