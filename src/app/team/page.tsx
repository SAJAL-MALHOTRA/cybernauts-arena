"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Trophy,
  Swords,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Shield,
  Code,
  Flame,
  Volume2,
  VolumeX,
  Lock,
  KeyRound,
  Terminal,
  Coins,
  ChevronRight,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  color?: string;
  credits: number;
}

interface QuestionOption {
  index: number;
  text: string;
  outcome?: "best" | "less_good" | "neutral" | "less_bad" | "worst";
  creditChange?: number;
}

interface QuestionView {
  id: number;
  roundId?: number;
  pushedAt?: number;
  duelNumber?: number;
  duelTitle?: string;
  caseStudy?: string;
  mission?: string;
  questionNumber?: number;
  title: string;
  category: string;
  code?: string;
  question: string;
  options: QuestionOption[];
  explanation?: string;
}

interface DuelView {
  id: string;
  duelNumber: number;
  myCredits: number;
  opponentCredits: number;
  myRoundDelta: number;
  opponentRoundDelta: number;
  questionsAnswered?: number;
  totalQuestions?: number;
  status: string;
  winner: Team | null;
  history: any[];
}

interface TeamViewState {
  team: Team;
  currentStage: string;
  phase: "idle" | "question_incoming" | "active" | "locked" | "revealed";
  stageStatus: "active" | "advanced" | "eliminated" | "waiting";
  duel: DuelView | null;
  opponent: Team | null;
  mySubmission: {
    questionId?: number;
    roundId?: number;
    optionIndex: number;
    timeTaken: number;
    outcome?: string;
    creditChange?: number;
  } | null;
  opponentSubmissionStatus: "thinking" | "locked_in";
  activeQuestion: QuestionView | null;
  timer: {
    status: "idle" | "running" | "paused" | "expired";
    duration: number;
    startedAt: number;
    deadline: number;
    pausedAt: number | null;
    remainingSeconds: number;
  };
  serverTime: number;
}

function playTone(freq: number, type: OscillatorType = "sine", duration: number = 0.15, gainVal: number = 0.12) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {}
}

function getApiBaseUrl() {
  return "";
}

const OUTCOME_LABELS: Record<string, { label: string; delta: string; color: string; bg: string }> = {
  best: { label: "BEST ANSWER", delta: "+3,000", color: "#22c55e", bg: "rgba(34, 197, 94, 0.2)" },
  less_good: { label: "LESS-GOOD", delta: "+1,500", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.2)" },
  neutral: { label: "NEUTRAL", delta: "0", color: "#a1a1aa", bg: "rgba(161, 161, 170, 0.2)" },
  less_bad: { label: "LESS-BAD", delta: "-2,000", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.2)" },
  worst: { label: "WORST ANSWER", delta: "-4,000", color: "#ef4444", bg: "rgba(239, 68, 68, 0.2)" },
};

export default function StudentTeamPage() {
  const [teamId, setTeamId] = useState<string>("T01");
  const [authToken, setAuthToken] = useState<string>("");
  const [pinInput, setPinInput] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);

  const [state, setState] = useState<TeamViewState | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [clientRemaining, setClientRemaining] = useState<number>(30);
  const [lastQuestionId, setLastQuestionId] = useState<number | null>(null);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const serverOffsetRef = useRef<number>(0);
  const lastSecondBeeped = useRef<number | null>(null);
  const lastRoundKeyRef = useRef<string | null>(null);

  // Initialize Team ID and Auth Token from URL / storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get("id") || urlParams.get("teamId") || "T01";
      const formatted = urlId.toUpperCase().startsWith("T") ? urlId.toUpperCase() : `T${urlId.padStart(2, "0")}`;
      setTeamId(formatted);
      document.title = formatted ? `CYBERNAUTS | Team ${formatted}` : "CYBERNAUTS | Team Station";

      const urlPin = urlParams.get("pin");
      if (urlPin) setPinInput(urlPin);
      const urlToken = urlParams.get("token");

      const savedToken = sessionStorage.getItem(`cybernauts_token_${formatted}`) || sessionStorage.getItem(`sabernaut_token_${formatted}`);

      if (urlToken) {
        verifyAuth(formatted, "", urlToken);
      } else if (urlPin) {
        verifyAuth(formatted, urlPin, "");
      } else if (savedToken) {
        verifyAuth(formatted, "", savedToken);
      } else {
        setIsVerifying(false);
      }
    }
  }, []);

  const verifyAuth = async (tId: string, pin: string, token: string) => {
    setIsVerifying(true);
    try {
      setAuthError("");
      const res = await fetch(`${getApiBaseUrl()}/api/tournament/auth-team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: tId, pin, token }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuthToken(data.token);
        setIsAuthenticated(true);
        sessionStorage.setItem(`cybernauts_token_${tId}`, data.token);
        sessionStorage.setItem(`sabernaut_token_${tId}`, data.token);

        // Pre-fetch state immediately so student enters seamlessly
        fetch(`${getApiBaseUrl()}/api/tournament/team/${tId}`)
          .then((r) => r.json())
          .then((d) => setState(d))
          .catch(() => {});
      } else {
        setIsAuthenticated(false);
        setAuthError(data.message || "Invalid 4-Digit Team PIN.");
      }
    } catch (err) {
      setIsAuthenticated(false);
      setAuthError("Failed to reach server. Please check connection.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Poll state every 500ms
  const pollTeamState = async () => {
    if (!teamId) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/tournament/team/${teamId}`);
      if (res.ok) {
        const data: TeamViewState = await res.json();
        setState(data);

        const clientNow = Date.now();
        if (data.serverTime) {
          serverOffsetRef.current = data.serverTime - clientNow;
        }

        const currentQId = data.activeQuestion ? data.activeQuestion.id : null;
        const currentRoundKey = data.activeQuestion
          ? `${data.activeQuestion.id}-${data.activeQuestion.roundId || 0}-${data.activeQuestion.pushedAt || 0}`
          : null;

        // When a new round or question is pushed, completely unlock and reset local selection:
        if (currentRoundKey !== lastRoundKeyRef.current) {
          lastRoundKeyRef.current = currentRoundKey;
          setLastQuestionId(currentQId);
          setSelectedOption(null);
          setHasCelebrated(false);
          lastSecondBeeped.current = null;
        }

        // Synchronize selectedOption with server strictly for the current active question:
        if (
          data.mySubmission &&
          data.activeQuestion &&
          data.mySubmission.questionId === data.activeQuestion.id
        ) {
          setSelectedOption(data.mySubmission.optionIndex);
        } else {
          // No submission on server for this active question -> UNLOCK options:
          setSelectedOption(null);
        }

        if (data.phase === "revealed" && data.duel?.winner?.id === teamId && !hasCelebrated) {
          setHasCelebrated(true);
          if (soundEnabled) {
            playTone(523.25, "triangle", 0.15);
            setTimeout(() => playTone(659.25, "triangle", 0.15), 120);
            setTimeout(() => playTone(783.99, "triangle", 0.25), 240);
          }
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        }

        // Desk presence heartbeat — fire-and-forget, no retry
        if (authToken) {
          fetch(`${getApiBaseUrl()}/api/tournament/heartbeat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId, token: authToken }),
          }).catch(() => { /* silent fail — presence is best-effort */ });
        }
      }
    } catch (err) {
      console.warn("Poll state error:", err);
    }
  };

  useEffect(() => {
    pollTeamState();
    const interval = setInterval(pollTeamState, 500);
    return () => clearInterval(interval);
  }, [teamId, lastQuestionId, selectedOption, hasCelebrated, soundEnabled]);

  // Synchronized Master Clock Tick (100ms)
  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (!state || !state.timer) return;

      if (state.timer.status === "running" && state.timer.deadline) {
        const calibratedNow = Date.now() + serverOffsetRef.current;
        const diffMs = state.timer.deadline - calibratedNow;
        const seconds = Math.max(0, Math.ceil(diffMs / 1000));
        setClientRemaining(seconds);

        if (soundEnabled && seconds <= 5 && seconds > 0 && lastSecondBeeped.current !== seconds) {
          lastSecondBeeped.current = seconds;
          playTone(880, "sawtooth", 0.08, 0.1);
        } else if (soundEnabled && seconds === 0 && lastSecondBeeped.current !== 0) {
          lastSecondBeeped.current = 0;
          playTone(220, "sawtooth", 0.35, 0.18);
        }
      } else if (state.timer.status === "paused") {
        setClientRemaining(state.timer.remainingSeconds || 0);
      } else if (state.timer.status === "idle") {
        setClientRemaining(state.timer.duration || 30);
      } else if (state.timer.status === "expired") {
        setClientRemaining(0);
      }
    }, 100);

    return () => clearInterval(timerInterval);
  }, [state, soundEnabled]);

  // Submit Answer Option
  const handleSelectOption = async (optionIndex: number) => {
    if (!state || !state.duel || !state.activeQuestion) return;
    const hasValidSubmission = !!(
      state.mySubmission &&
      state.activeQuestion &&
      state.mySubmission.questionId === state.activeQuestion.id
    );
    if (selectedOption !== null || hasValidSubmission) return;
    if (state.phase === "locked" || state.phase === "revealed") return;
    if (state.timer.status === "running" && clientRemaining <= 0) return;

    setSelectedOption(optionIndex);

    if (soundEnabled) {
      playTone(600, "sine", 0.12, 0.15);
    }

    try {
      await fetch(`${getApiBaseUrl()}/api/tournament/submit-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          duelId: state.duel.id,
          optionIndex,
          token: authToken,
        }),
      });
      pollTeamState();
    } catch (err) {
      console.error(err);
    }
  };

  const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

  // Formatted Clock MM:SS
  const formatClock = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // If NOT authenticated, show PIN Verification Gate or Connecting loader
  if (!isAuthenticated) {
    if (isVerifying) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#09090b",
            color: "#f4f4f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "420px",
              width: "100%",
              background: "#121215",
              borderRadius: "20px",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              padding: "2.5rem 2rem",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: "3px solid rgba(56, 189, 248, 0.2)",
                borderTopColor: "#38bdf8",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 1.5rem auto",
              }}
            />
            <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#38bdf8", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              AUTHENTICATING STATION
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff", marginBottom: "0.5rem" }}>
              Connecting Team {teamId}...
            </h3>
            <p style={{ color: "#a1a1aa", fontSize: "0.85rem" }}>
              Verifying team credentials and establishing arena session.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#09090b",
          color: "#f4f4f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            width: "100%",
            background: "#121215",
            borderRadius: "20px",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            padding: "2.25rem 2rem",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
            textAlign: "center",
          }}
        >
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem auto" }}>
            <KeyRound size={28} color="#38bdf8" />
          </div>

          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#38bdf8", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "0.25rem" }}>
            CYBERNAUTS CHAMPIONSHIP DUEL
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff", marginBottom: "0.5rem" }}>
            Team {teamId} Login
          </h2>

          <p style={{ color: "#a1a1aa", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Enter your team&apos;s private 4-digit PIN provided on your desk slip to access your duel station.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyAuth(teamId, pinInput, "");
            }}
          >
            <input
              type="password"
              maxLength={4}
              required
              autoFocus
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              style={{
                width: "100%",
                padding: "0.85rem",
                borderRadius: "12px",
                background: "#09090b",
                border: "2px solid rgba(56, 189, 248, 0.4)",
                color: "#ffffff",
                fontSize: "1.8rem",
                fontWeight: 900,
                textAlign: "center",
                letterSpacing: "8px",
                outline: "none",
                marginBottom: "1rem",
              }}
            />

            {authError && (
              <div style={{ color: "#ef4444", fontSize: "0.82rem", fontWeight: 700, marginBottom: "1rem" }}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.85rem",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #38bdf8, #0284c7)",
                border: "none",
                color: "#09090b",
                fontWeight: 900,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              Enter Duel Station
            </button>
          </form>

          <div style={{ fontSize: "0.72rem", color: "#52525b", marginTop: "1.5rem" }}>
            Authorized participant station • Access token secured
          </div>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Connecting to Arena Server...
      </div>
    );
  }

  const { team, opponent, duel, activeQuestion, phase } = state;
  const hasValidSubmission = !!(
    state.mySubmission &&
    state.activeQuestion &&
    state.mySubmission.questionId === state.activeQuestion.id
  );
  const hasSubmitted = selectedOption !== null || hasValidSubmission;
  const isRevealed = phase === "revealed";
  const isTimerRunning = state?.timer?.status === "running";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090b",
        color: "#f4f4f5",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem 1rem",
      }}
    >
      {/* MAIN STUDENT GAME CONTAINER - MATCHES WIREFRAME EXACTLY */}
      <div
        style={{
          maxWidth: "760px",
          width: "100%",
          background: "#121215",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "2rem",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          position: "relative",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#38bdf8", letterSpacing: "2px", textTransform: "uppercase" }}>
              CYBERNAUTS — CHAMPIONSHIP DUEL
            </div>
            <div style={{ fontSize: "0.85rem", color: "#a1a1aa", fontWeight: 700 }}>
              Round 2 Knockout • Table Station {team.id}
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              padding: "0.45rem",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: soundEnabled ? "#38bdf8" : "#71717a",
              cursor: "pointer",
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        {/* TEAM MATCHUP & CREDITS BANNER */}
        <div
          style={{
            background: "#18181b",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            padding: "1.25rem 1.5rem",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
          }}
        >
          {/* TEAM T01 */}
          <div>
            <div style={{ fontSize: "0.75rem", color: "#a1a1aa", fontWeight: 800 }}>YOUR TEAM</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#ffffff" }}>
              {team.name} <span style={{ fontSize: "0.85rem", color: "#38bdf8" }}>({team.id})</span>
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#eab308", marginTop: "0.2rem" }}>
              {(duel ? duel.myCredits : team.credits).toLocaleString()} CR
              {isRevealed && duel && duel.myRoundDelta !== 0 && (
                <span style={{ fontSize: "0.8rem", marginLeft: "0.4rem", color: duel.myRoundDelta > 0 ? "#22c55e" : "#ef4444" }}>
                  ({duel.myRoundDelta > 0 ? `+${duel.myRoundDelta.toLocaleString()}` : duel.myRoundDelta.toLocaleString()})
                </span>
              )}
            </div>
          </div>

          {/* VS */}
          <div style={{ textAlign: "center", padding: "0 1rem" }}>
            <span style={{ fontSize: "1rem", fontWeight: 900, color: "#f43f5e", letterSpacing: "1px" }}>
              VS
            </span>
          </div>

          {/* TEAM T02 */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.75rem", color: "#a1a1aa", fontWeight: 800 }}>OPPONENT</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 900, color: opponent ? "#ffffff" : "#71717a" }}>
              {opponent ? opponent.name : "TBD"} <span style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>({opponent?.id || "?"})</span>
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: opponent ? "#eab308" : "#71717a", marginTop: "0.2rem" }}>
              {((duel && opponent ? duel.opponentCredits : opponent?.credits) ?? 10000).toLocaleString()} CR
              {isRevealed && duel && duel.opponentRoundDelta !== 0 && (
                <span style={{ fontSize: "0.8rem", marginLeft: "0.4rem", color: duel.opponentRoundDelta > 0 ? "#22c55e" : "#ef4444" }}>
                  ({duel.opponentRoundDelta > 0 ? `+${duel.opponentRoundDelta.toLocaleString()}` : duel.opponentRoundDelta.toLocaleString()})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SYNCHRONIZED CLOCK (00:24) */}
        <div style={{ textAlign: "center", margin: "0.5rem 0" }}>
          <div
            style={{
              fontSize: "3.2rem",
              fontWeight: 900,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              color: clientRemaining <= 7 && isTimerRunning ? "#ef4444" : "#38bdf8",
              letterSpacing: "2px",
            }}
          >
            {formatClock(clientRemaining)}
          </div>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#71717a", textTransform: "uppercase", marginTop: "0.3rem" }}>
            {phase === "question_incoming"
              ? "CHALLENGE INCOMING — PREPARE STRATEGY"
              : phase === "active"
              ? "DISCUSS & SELECT STRATEGY"
              : phase === "locked"
              ? "TIME LOCKED — AWAITING REVEAL"
              : phase === "revealed"
              ? "OUTCOMES REVEALED"
              : "WAITING FOR NEXT CHALLENGE..."}
          </div>
        </div>

        {/* PROBLEM STATEMENT BOX */}
        {phase === "idle" || !activeQuestion ? (
          <div
            style={{
              padding: "3rem 1.5rem",
              background: "#09090b",
              borderRadius: "16px",
              border: "1px dashed rgba(255, 255, 255, 0.15)",
              textAlign: "center",
            }}
          >
            <Clock size={32} color="#71717a" style={{ margin: "0 auto 0.75rem auto" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.3rem" }}>
              Waiting for Host to Launch Problem...
            </h3>
            <p style={{ color: "#71717a", fontSize: "0.85rem", margin: 0 }}>
              The problem statement will appear here simultaneously when pushed by the admin.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "#09090b",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              padding: "1.5rem",
            }}
          >
            {/* CASE STUDY & MISSION BANNER */}
            {activeQuestion.caseStudy && (
              <div
                style={{
                  background: "#18181b",
                  borderRadius: "12px",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  padding: "1rem 1.15rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "#38bdf8", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                    DUEL {String(activeQuestion.duelNumber || 1).padStart(2, "0")} · {activeQuestion.duelTitle}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    {[1, 2, 3].map((step) => {
                      const currentQ = activeQuestion.questionNumber || 1;
                      const isPast = step < currentQ;
                      const isCurrent = step === currentQ;
                      return (
                        <span
                          key={step}
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: isCurrent ? "#38bdf8" : isPast ? "#22c55e" : "#3f3f46",
                            transition: "all 0.2s ease",
                          }}
                        />
                      );
                    })}
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#a1a1aa", marginLeft: "0.3rem" }}>
                      Q{activeQuestion.questionNumber || 1}/3
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: "0.86rem", color: "#f4f4f5", lineHeight: "1.5", marginBottom: "0.6rem" }}>
                  <strong style={{ color: "#a1a1aa" }}>Case: </strong>
                  {activeQuestion.caseStudy}
                </div>

                {activeQuestion.mission && (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#93c5fd",
                      background: "rgba(56, 189, 248, 0.08)",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "8px",
                      borderLeft: "3px solid #38bdf8",
                      lineHeight: "1.4",
                    }}
                  >
                    <strong style={{ color: "#38bdf8" }}>Mission: </strong>
                    {activeQuestion.mission}
                  </div>
                )}
              </div>
            )}

            {/* QUESTION HEADER */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "6px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", textTransform: "uppercase" }}>
                {activeQuestion.questionNumber ? `Question ${activeQuestion.questionNumber} of 3` : activeQuestion.category}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#a1a1aa", fontWeight: 700 }}>
                {activeQuestion.title}
              </span>
            </div>

            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff", marginBottom: "1rem", lineHeight: 1.4 }}>
              {activeQuestion.question}
            </h3>

            {activeQuestion.code && (
              <div
                style={{
                  background: "#121215",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "0.85rem 1rem",
                  fontFamily: "monospace",
                  fontSize: "0.88rem",
                  color: "#e2e8f0",
                  overflowX: "auto",
                  marginBottom: "1rem",
                }}
              >
                <pre style={{ margin: 0 }}>{activeQuestion.code}</pre>
              </div>
            )}

            {/* 5 OPTIONS: A, B, C, D, E */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "1.25rem" }}>
              {activeQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isLocked =
                  hasSubmitted ||
                  (state.timer.status === "running" && clientRemaining <= 0) ||
                  phase === "locked" ||
                  phase === "revealed";
                const outcomeInfo = opt.outcome ? OUTCOME_LABELS[opt.outcome] : null;

                let border = isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.08)";
                let bg = isSelected ? "rgba(56, 189, 248, 0.12)" : "#18181b";

                if (isRevealed && outcomeInfo) {
                  border = outcomeInfo.color;
                  if (isSelected) bg = outcomeInfo.bg;
                }

                return (
                  <button
                    key={idx}
                    disabled={isLocked}
                    onClick={() => handleSelectOption(idx)}
                    style={{
                      padding: "0.9rem 1.15rem",
                      borderRadius: "12px",
                      background: bg,
                      border: `1.5px solid ${border}`,
                      color: "#ffffff",
                      textAlign: "left",
                      cursor: isLocked ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      opacity: isLocked && !isSelected && !isRevealed ? 0.5 : 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.08)",
                          color: isSelected ? "#09090b" : "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: "0.95rem",
                        }}
                      >
                        {OPTION_LETTERS[idx]}
                      </div>
                      <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{opt.text}</span>
                    </div>

                    {isRevealed && outcomeInfo ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.6rem", borderRadius: "6px", background: outcomeInfo.bg, color: outcomeInfo.color, fontSize: "0.78rem", fontWeight: 900 }}>
                        <span>{outcomeInfo.label}</span>
                        <span>({outcomeInfo.delta})</span>
                      </div>
                    ) : isSelected ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 800, color: "#38bdf8" }}>
                        <CheckCircle2 size={16} />
                        <span>LOCKED</span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* ACTION STATUS BAR */}
            <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
              {hasSubmitted ? (
                <div style={{ padding: "0.85rem", borderRadius: "10px", background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", fontWeight: 800, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={18} />
                  <span>STRATEGY LOCKED IN (OPTION {OPTION_LETTERS[selectedOption || 0]})</span>
                  {state.mySubmission?.timeTaken && (
                    <span style={{ color: "#ffffff", marginLeft: "0.5rem" }}>• {state.mySubmission.timeTaken}s</span>
                  )}
                </div>
              ) : phase === "active" ? (
                <div style={{ padding: "0.85rem", borderRadius: "10px", background: "rgba(255, 255, 255, 0.05)", border: "1px dashed rgba(255, 255, 255, 0.2)", color: "#a1a1aa", fontWeight: 800, fontSize: "0.85rem" }}>
                  CLICK AN OPTION (A - E) TO SUBMIT YOUR STRATEGY
                </div>
              ) : null}
            </div>

            {/* REVEALED EXPLANATION */}
            {isRevealed && activeQuestion.explanation && (
              <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: "12px", background: "rgba(234, 179, 8, 0.08)", border: "1px solid rgba(234, 179, 8, 0.25)", color: "#fde047", fontSize: "0.85rem", lineHeight: 1.4 }}>
                💡 <strong>Strategy Analysis:</strong> {activeQuestion.explanation}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
