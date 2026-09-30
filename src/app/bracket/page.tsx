"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Trophy,
  Swords,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Maximize2,
  Minimize2,
  ChevronRight,
  Terminal,
  Activity,
  Layers,
  Zap,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface Team {
  id: string;
  name: string;
  credits?: number;
  score?: number;
  seed: number;
  members?: string;
  color?: string;
  multiplier?: number;
}

interface DuelSubmission {
  teamId?: string;
  optionIndex?: number;
  outcome?: "best" | "less_good" | "neutral" | "less_bad" | "worst" | string;
  creditChange?: number;
  timeTaken?: number;
  submittedAt?: number;
}

interface Duel {
  id: string;
  stage: "round_of_16" | "quarterfinals" | "semifinals" | "finals";
  duelNumber: number;
  teamA: Team | null;
  teamB: Team | null;
  creditsA: number;
  creditsB: number;
  roundDeltaA?: number;
  roundDeltaB?: number;
  questionsAnswered?: number;
  totalQuestions?: number;
  winner: Team | null;
  status: "pending" | "in_progress" | "round_evaluated" | "completed";
  currentRoundSubmissions?: {
    teamA: DuelSubmission | null;
    teamB: DuelSubmission | null;
  };
  history?: any[];
}

interface TournamentState {
  tournamentName: string;
  currentStage: "round_of_16" | "quarterfinals" | "semifinals" | "finals" | "champion";
  stages: string[];
  phase: "idle" | "question_incoming" | "active" | "locked" | "revealed";
  teams: Team[];
  bracket: {
    round_of_16: Duel[];
    quarterfinals: Duel[];
    semifinals: Duel[];
    finals: Duel[];
  };
  activeDuels: Duel[];
  timer: {
    status: "idle" | "running" | "paused" | "expired";
    duration: number;
    startedAt: number;
    deadline: number;
    pausedAt: number | null;
    remainingSeconds: number;
  };
  activeQuestion: {
    id: number;
    duelNumber?: number;
    duelTitle?: string;
    caseStudy?: string;
    mission?: string;
    questionNumber?: number;
    title: string;
    category: string;
    question: string;
  } | null;
  champion: Team | null;
  serverTime: number;
}

const STAGE_CONFIG: Record<string, { label: string; short: string; totalDuels: number }> = {
  round_of_16: { label: "ROUND OF 16", short: "R16", totalDuels: 8 },
  quarterfinals: { label: "QUARTERFINALS", short: "QF", totalDuels: 4 },
  semifinals: { label: "SEMIFINALS", short: "SF", totalDuels: 2 },
  finals: { label: "GRAND FINALS", short: "FINALS", totalDuels: 1 },
  champion: { label: "TOURNAMENT CONCLUDED", short: "CHAMP", totalDuels: 0 },
};

// ============================================================================
// Main Component: Refined Esports Broadcast Control Room
// ============================================================================

export default function BracketProjectorPage() {
  const [data, setData] = useState<TournamentState | null>(null);
  const [clientRemaining, setClientRemaining] = useState<number>(30);
  const [selectedDuelId, setSelectedDuelId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const serverOffsetRef = useRef<number>(0);

  // Poll state from authoritative backend
  const fetchState = async () => {
    try {
      const res = await fetch("/api/tournament/state");
      if (res.ok) {
        const state: TournamentState = await res.json();
        setData(state);

        // Clock synchronization with server drift compensation
        const clientNow = Date.now();
        if (state.serverTime) {
          serverOffsetRef.current = state.serverTime - clientNow;
        }

        if (state.timer.status === "running" && state.timer.deadline) {
          const synchronizedNow = Date.now() + serverOffsetRef.current;
          const rem = Math.max(0, Math.ceil((state.timer.deadline - synchronizedNow) / 1000));
          setClientRemaining(rem);
        } else {
          setClientRemaining(state.timer.remainingSeconds ?? 30);
        }

        // Auto-podium trigger on champion
        if (state.champion && !hasCelebrated) {
          setHasCelebrated(true);
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.4 },
            colors: ["#00f0ff", "#10b981", "#f59e0b", "#ffffff"],
          });
        }
      }
    } catch (err) {
      console.warn("[Arena Projector] State poll error:", err);
    }
  };

  useEffect(() => {
    document.title = "CYBERNAUTS ARENA // ARENA PROJECTOR";
    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, [hasCelebrated]);

  // High-frequency clock tick
  useEffect(() => {
    const tick = setInterval(() => {
      if (data?.timer.status === "running" && data.timer.deadline) {
        const synchronizedNow = Date.now() + serverOffsetRef.current;
        const rem = Math.max(0, Math.ceil((data.timer.deadline - synchronizedNow) / 1000));
        setClientRemaining(rem);
      }
    }, 250);
    return () => clearInterval(tick);
  }, [data]);

  // Determine which duel is in the active focus marquee
  const currentStageDuels = useMemo(() => {
    if (!data) return [];
    return data.bracket[data.currentStage as keyof typeof data.bracket] || [];
  }, [data]);

  const activeFocusDuel = useMemo(() => {
    if (!data) return null;
    const allDuels = [
      ...(data.bracket.finals || []),
      ...(data.bracket.semifinals || []),
      ...(data.bracket.quarterfinals || []),
      ...(data.bracket.round_of_16 || []),
    ];

    if (selectedDuelId) {
      const match = allDuels.find((d) => d.id === selectedDuelId);
      if (match) return match;
    }

    // Default to the first in_progress or round_evaluated duel in current stage
    const liveMatch = currentStageDuels.find(
      (d) => d.status === "in_progress" || d.status === "round_evaluated"
    );
    if (liveMatch) return liveMatch;

    // Otherwise fallback to the first duel of current stage
    return currentStageDuels[0] || allDuels[0] || null;
  }, [data, selectedDuelId, currentStageDuels]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#060709",
          color: "#94a3b8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.85rem",
          letterSpacing: "1.5px",
        }}
      >
        <span className="animate-pulse-dot" style={{ width: 8, height: 8, background: "#00f0ff", marginRight: 10 }} />
        INITIALIZING BROADCAST CONTROL FEED...
      </div>
    );
  }

  const isTimerRunning = data.timer.status === "running";
  const isTimerExpired = data.timer.status === "expired" || clientRemaining === 0;
  const isTimerWarning = isTimerRunning && clientRemaining <= 10 && clientRemaining > 5;
  const isTimerCritical = isTimerRunning && clientRemaining <= 5 && clientRemaining > 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060709",
        color: "#f4f4f5",
        fontFamily: "var(--font-primary, sans-serif)",
        padding: "1rem 1.5rem 2rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        overflowX: "auto",
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. TOP BROADCAST CONTROL HEADER
          ───────────────────────────────────────────────────────────────────────────── */}
      <header
        style={{
          background: "#0a0c10",
          border: "1px solid #171b24",
          borderBottom: "2px solid #232a38",
          padding: "0.65rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        {/* Left: Tournament Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              padding: "4px 8px",
              background: "#121620",
              border: "1px solid #1f2838",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "#00f0ff",
              letterSpacing: "1.5px",
            }}
          >
            SYS.ARENA
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 900,
                  letterSpacing: "-0.3px",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                Cybernauts Arena
              </span>
              <span style={{ color: "#334155", fontSize: "0.9rem" }}>//</span>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: "1px",
                }}
              >
                {STAGE_CONFIG[data.currentStage]?.label || data.currentStage.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Broadcast Telemetry */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "4px 10px",
              background: "#0c0f16",
              border: "1px solid #1e2433",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.68rem",
              letterSpacing: "1px",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isTimerRunning ? "#00ff9d" : "#64748b",
                boxShadow: isTimerRunning ? "0 0 8px #00ff9d" : "none",
              }}
            />
            <span style={{ color: isTimerRunning ? "#00ff9d" : "#94a3b8" }}>
              {isTimerRunning ? "LIVE STREAM ACTIVE" : "BROADCAST STANDBY"}
            </span>
          </div>

          <div
            style={{
              padding: "4px 10px",
              background: "#0c0f16",
              border: "1px solid #1e2433",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.68rem",
              color: "#94a3b8",
              letterSpacing: "1px",
            }}
          >
            PHASE: <strong style={{ color: "#ffffff" }}>{data.phase.toUpperCase()}</strong>
          </div>
        </div>

        {/* Right: Stage Selector & Fullscreen */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.68rem",
              color: "#64748b",
            }}
          >
            <span>FOCUS DUEL:</span>
            <div style={{ display: "flex", gap: "2px" }}>
              {currentStageDuels.map((d) => {
                const isSelected = activeFocusDuel?.id === d.id;
                const isLive = d.status === "in_progress";
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDuelId(d.id)}
                    style={{
                      background: isSelected ? "#00f0ff" : isLive ? "#141c28" : "#0f1218",
                      color: isSelected ? "#060709" : isLive ? "#00f0ff" : "#64748b",
                      border: `1px solid ${isSelected ? "#00f0ff" : isLive ? "#0284c7" : "#1e2433"}`,
                      padding: "2px 6px",
                      fontSize: "0.65rem",
                      fontFamily: "var(--font-mono, monospace)",
                      fontWeight: 800,
                      cursor: "pointer",
                      borderRadius: "0px",
                    }}
                    title={`Focus ${d.id}`}
                  >
                    D{d.duelNumber}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            style={{
              background: "#0f1218",
              border: "1px solid #1e2433",
              color: "#94a3b8",
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.68rem",
              fontFamily: "var(--font-mono, monospace)",
            }}
            title="Toggle Stadium Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{isFullscreen ? "EXIT" : "FULLSCREEN"}</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. ACTIVE DUEL HERO MARQUEE (UNMISTAKABLE BROADCAST FOCAL POINT)
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeFocusDuel && (
        <section
          style={{
            background: "#090b10",
            border: "1px solid #1a202c",
            borderTop: "3px solid #00f0ff",
            padding: "1.25rem 1.5rem",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "1.5rem",
            position: "relative",
          }}
        >
          {/* TEAM A (LEFT / CYAN LIVE SIGNAL) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              borderRight: "1px solid #161b24",
              paddingRight: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: "#00f0ff",
                  padding: "1px 6px",
                  background: "rgba(0, 240, 255, 0.1)",
                  border: "1px solid rgba(0, 240, 255, 0.3)",
                }}
              >
                SEED #{activeFocusDuel.teamA?.seed || "?"} // {activeFocusDuel.teamA?.id || "TBD"}
              </span>
              {activeFocusDuel.teamA?.members && (
                <span style={{ fontSize: "0.68rem", color: "#64748b", fontFamily: "var(--font-mono, monospace)" }}>
                  {activeFocusDuel.teamA.members}
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: "clamp(1.5rem, 2.8vw, 2.4rem)",
                fontWeight: 900,
                color: activeFocusDuel.teamA ? "#ffffff" : "#475569",
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
                marginBottom: "0.4rem",
              }}
            >
              {activeFocusDuel.teamA?.name || "AWAITING QUALIFIER"}
            </div>

            {/* Credits & Delta */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: "clamp(1.4rem, 2.2vw, 2rem)",
                  fontWeight: 900,
                  color: "#00f0ff",
                }}
              >
                {(activeFocusDuel.creditsA ?? 10000).toLocaleString()}{" "}
                <span style={{ fontSize: "0.85rem", color: "#38bdf8", fontWeight: 700 }}>CR</span>
              </span>

              {/* Status / Delta Pill */}
              <DuelTeamStatusPill
                submission={activeFocusDuel.currentRoundSubmissions?.teamA}
                delta={activeFocusDuel.roundDeltaA}
                phase={data.phase}
                isWinner={activeFocusDuel.winner?.id === activeFocusDuel.teamA?.id}
              />
            </div>
          </div>

          {/* CENTER: AUTHORITATIVE CLOCK & INCIDENT CONTEXT */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              minWidth: "260px",
              padding: "0 1rem",
            }}
          >
            {/* Duel Meta Tag */}
            <div
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "#94a3b8",
                letterSpacing: "1.5px",
                marginBottom: "0.25rem",
              }}
            >
              MATCH {activeFocusDuel.duelNumber} // {activeFocusDuel.id}
            </div>

            {/* Authoritative Countdown Clock */}
            <div
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontVariantNumeric: "tabular-nums",
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: "-1px",
                color: isTimerCritical
                  ? "#ff0055"
                  : isTimerWarning
                  ? "#f59e0b"
                  : isTimerExpired
                  ? "#f43f5e"
                  : "#ffffff",
                transition: "color 0.2s ease",
              }}
            >
              {formatTime(clientRemaining)}
            </div>

            {/* Timer Status State Indicator */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                marginTop: "0.35rem",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.68rem",
                fontWeight: 700,
                color: isTimerCritical ? "#ff0055" : isTimerWarning ? "#f59e0b" : "#64748b",
                letterSpacing: "1px",
              }}
            >
              <Clock size={11} />
              <span>
                {isTimerCritical
                  ? "CRITICAL // EXPIRING"
                  : isTimerWarning
                  ? "WARNING // FINAL SECONDS"
                  : isTimerExpired
                  ? "SUBMISSIONS LOCKED"
                  : isTimerRunning
                  ? "AUTHORITATIVE CLOCK RUNNING"
                  : "CLOCK STANDBY"}
              </span>
            </div>

            {/* Active Question Preview */}
            {data.activeQuestion && (
              <div
                style={{
                  marginTop: "0.6rem",
                  padding: "4px 10px",
                  background: "#0e1118",
                  border: "1px solid #1a2230",
                  maxWidth: "320px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.65rem",
                    fontFamily: "var(--font-mono, monospace)",
                    color: "#00f0ff",
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  INCIDENT #{data.activeQuestion.id} // {data.activeQuestion.title}
                </div>
              </div>
            )}
          </div>

          {/* TEAM B (RIGHT / CORAL-RED LIVE SIGNAL) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              borderLeft: "1px solid #161b24",
              paddingLeft: "1.5rem",
              textAlign: "right",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
              {activeFocusDuel.teamB?.members && (
                <span style={{ fontSize: "0.68rem", color: "#64748b", fontFamily: "var(--font-mono, monospace)" }}>
                  {activeFocusDuel.teamB.members}
                </span>
              )}
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: "#f43f5e",
                  padding: "1px 6px",
                  background: "rgba(244, 63, 94, 0.1)",
                  border: "1px solid rgba(244, 63, 94, 0.3)",
                }}
              >
                SEED #{activeFocusDuel.teamB?.seed || "?"} // {activeFocusDuel.teamB?.id || "TBD"}
              </span>
            </div>

            <div
              style={{
                fontSize: "clamp(1.5rem, 2.8vw, 2.4rem)",
                fontWeight: 900,
                color: activeFocusDuel.teamB ? "#ffffff" : "#475569",
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
                marginBottom: "0.4rem",
              }}
            >
              {activeFocusDuel.teamB?.name || "AWAITING QUALIFIER"}
            </div>

            {/* Credits & Delta */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
              <DuelTeamStatusPill
                submission={activeFocusDuel.currentRoundSubmissions?.teamB}
                delta={activeFocusDuel.roundDeltaB}
                phase={data.phase}
                isWinner={activeFocusDuel.winner?.id === activeFocusDuel.teamB?.id}
              />

              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: "clamp(1.4rem, 2.2vw, 2rem)",
                  fontWeight: 900,
                  color: "#f43f5e",
                }}
              >
                {(activeFocusDuel.creditsB ?? 10000).toLocaleString()}{" "}
                <span style={{ fontSize: "0.85rem", color: "#fb7185", fontWeight: 700 }}>CR</span>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. 5-TIER ECONOMY CALIBRATION LEGEND (SLIM BROADCAST STRIP)
          ───────────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#080a0f",
          border: "1px solid #141822",
          padding: "0.45rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.6rem",
          fontSize: "0.72rem",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8" }}>
          <span style={{ color: "#00f0ff", fontWeight: 800 }}>ECONOMY MATRIX:</span>
          <span>STARTING BASELINE 10,000 CR</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ color: "#00ff9d" }}>BEST +3,000</span>
          <span style={{ color: "#38bdf8" }}>LESS-GOOD +1,500</span>
          <span style={{ color: "#64748b" }}>NEUTRAL 0</span>
          <span style={{ color: "#f59e0b" }}>LESS-BAD -2,000</span>
          <span style={{ color: "#f43f5e" }}>WORST -4,000</span>
          <span style={{ color: "#334155" }}>|</span>
          <span style={{ color: "#94a3b8" }}>TIE-BREAK: MILLISECOND TIME</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. 16-TEAM KNOCKOUT TOURNAMENT TREE (AUTHORITATIVE BRACKET)
          ───────────────────────────────────────────────────────────────────────────── */}
      <main
        style={{
          background: "#080a0f",
          border: "1px solid #141822",
          padding: "1.25rem",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Stage Columns Headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1.2fr 1.1fr 1fr",
            gap: "1.5rem",
            marginBottom: "0.85rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid #171b24",
          }}
        >
          {[
            { key: "round_of_16", label: "ROUND OF 16", count: "8 DUELS" },
            { key: "quarterfinals", label: "QUARTERFINALS", count: "4 DUELS" },
            { key: "semifinals", label: "SEMIFINALS", count: "2 DUELS" },
            { key: "finals", label: "GRAND FINALS", count: "CHAMPIONSHIP" },
          ].map((col) => {
            const isStageActive = data.currentStage === col.key;
            return (
              <div
                key={col.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.35rem 0.6rem",
                  background: isStageActive ? "#0d131f" : "transparent",
                  borderLeft: `2px solid ${isStageActive ? "#00f0ff" : "#1e2433"}`,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: isStageActive ? "#00f0ff" : "#94a3b8",
                    letterSpacing: "1px",
                  }}
                >
                  {col.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.65rem",
                    color: "#64748b",
                  }}
                >
                  {col.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* 4-Tier Match Grid with Tree Structural Spacing */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1.2fr 1.1fr 1fr",
            gap: "1.5rem",
            alignItems: "stretch",
          }}
        >
          {/* COLUMN 1: ROUND OF 16 (8 Duels) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {data.bracket.round_of_16.map((duel) => (
              <BroadcastDuelCard
                key={duel.id}
                duel={duel}
                isCurrentStage={data.currentStage === "round_of_16"}
                isFocused={activeFocusDuel?.id === duel.id}
                onSelect={() => setSelectedDuelId(duel.id)}
              />
            ))}
          </div>

          {/* COLUMN 2: QUARTERFINALS (4 Duels — Centered with paired connectors) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
              gap: "1.2rem",
            }}
          >
            {data.bracket.quarterfinals.map((duel) => (
              <BroadcastDuelCard
                key={duel.id}
                duel={duel}
                isCurrentStage={data.currentStage === "quarterfinals"}
                isFocused={activeFocusDuel?.id === duel.id}
                onSelect={() => setSelectedDuelId(duel.id)}
              />
            ))}
          </div>

          {/* COLUMN 3: SEMIFINALS (2 Duels) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
              gap: "2.5rem",
            }}
          >
            {data.bracket.semifinals.map((duel) => (
              <BroadcastDuelCard
                key={duel.id}
                duel={duel}
                isCurrentStage={data.currentStage === "semifinals"}
                isFocused={activeFocusDuel?.id === duel.id}
                onSelect={() => setSelectedDuelId(duel.id)}
              />
            ))}
          </div>

          {/* COLUMN 4: GRAND FINALS & PODIUM */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "1.5rem",
            }}
          >
            {data.bracket.finals.map((duel) => (
              <BroadcastDuelCard
                key={duel.id}
                duel={duel}
                isCurrentStage={data.currentStage === "finals"}
                isFocused={activeFocusDuel?.id === duel.id}
                onSelect={() => setSelectedDuelId(duel.id)}
                isChampionshipMatch
              />
            ))}

            {/* Champion Card Preview */}
            <div
              style={{
                marginTop: "0.5rem",
                padding: "1rem",
                background: data.champion ? "#121008" : "#0a0c10",
                border: `1px solid ${data.champion ? "#eab308" : "#1a202c"}`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  color: data.champion ? "#eab308" : "#64748b",
                  letterSpacing: "1px",
                  marginBottom: "0.25rem",
                }}
              >
                {data.champion ? "🏆 TOURNAMENT CHAMPION" : "CHAMPIONSHIP PODIUM"}
              </div>
              <div
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 900,
                  color: data.champion ? "#ffffff" : "#475569",
                }}
              >
                {data.champion ? data.champion.name : "TBD"}
              </div>
              {data.champion && (
                <div
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.7rem",
                    color: "#eab308",
                    marginTop: "0.2rem",
                  }}
                >
                  {data.champion.id} // WINNER OF ALL 4 ROUNDS
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Subcomponent: High-Legibility Broadcast Duel Card
// ============================================================================

interface BroadcastDuelCardProps {
  duel: Duel;
  isCurrentStage: boolean;
  isFocused: boolean;
  onSelect: () => void;
  isChampionshipMatch?: boolean;
}

function BroadcastDuelCard({
  duel,
  isCurrentStage,
  isFocused,
  onSelect,
  isChampionshipMatch,
}: BroadcastDuelCardProps) {
  const isLive = isCurrentStage && (duel.status === "in_progress" || duel.status === "round_evaluated");
  const isCompleted = duel.status === "completed" || !!duel.winner;

  // Determine card border
  const borderColor = isFocused
    ? "#00f0ff"
    : isLive
    ? "#0284c7"
    : isCompleted
    ? "#1e2838"
    : "#141720";

  return (
    <div
      onClick={onSelect}
      style={{
        background: isFocused ? "#0d111a" : isLive ? "#0a0e16" : "#090a0f",
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${isFocused ? "#00f0ff" : isLive ? "#0284c7" : isCompleted ? "#10b981" : "#1a2230"}`,
        padding: "0.55rem 0.75rem",
        cursor: "pointer",
        transition: "all 0.15s ease",
        position: "relative",
      }}
      title={`Click to feature ${duel.id} in top broadcast marquee`}
    >
      {/* Top Meta Line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.35rem",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.65rem",
        }}
      >
        <span style={{ color: isFocused ? "#00f0ff" : "#64748b", fontWeight: 800 }}>
          {duel.id} {isChampionshipMatch ? "★" : ""}
        </span>

        {isLive ? (
          <span
            style={{
              color: "#00f0ff",
              background: "rgba(0, 240, 255, 0.12)",
              padding: "1px 5px",
              fontWeight: 800,
            }}
          >
            LIVE DUEL
          </span>
        ) : isCompleted ? (
          <span style={{ color: "#10b981", fontWeight: 700 }}>
            FINAL
          </span>
        ) : (
          <span style={{ color: "#475569" }}>PENDING</span>
        )}
      </div>

      {/* Team A Row */}
      <TeamSlot
        team={duel.teamA}
        credits={duel.creditsA}
        isWinner={duel.winner?.id === duel.teamA?.id}
        isLive={isLive}
        isSideA
      />

      {/* Divider */}
      <div style={{ height: "1px", background: "#141822", margin: "3px 0" }} />

      {/* Team B Row */}
      <TeamSlot
        team={duel.teamB}
        credits={duel.creditsB}
        isWinner={duel.winner?.id === duel.teamB?.id}
        isLive={isLive}
        isSideA={false}
      />
    </div>
  );
}

// Single team row inside a duel card
function TeamSlot({
  team,
  credits,
  isWinner,
  isLive,
  isSideA,
}: {
  team: Team | null;
  credits: number;
  isWinner: boolean;
  isLive: boolean;
  isSideA: boolean;
}) {
  const nameColor = !team
    ? "#475569"
    : isWinner
    ? "#ffffff"
    : "#cbd5e1";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "2px 0",
        opacity: team ? 1 : 0.6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", overflow: "hidden" }}>
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.62rem",
            color: isWinner ? "#10b981" : "#64748b",
            fontWeight: 700,
            width: "28px",
          }}
        >
          {team ? `#${team.seed}` : "--"}
        </span>
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: isWinner ? 800 : 700,
            color: nameColor,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "115px",
          }}
        >
          {team ? team.name : "TBD"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        {isWinner && (
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.6rem",
              color: "#10b981",
              fontWeight: 800,
            }}
          >
            WIN
          </span>
        )}
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontVariantNumeric: "tabular-nums",
            fontSize: "0.82rem",
            fontWeight: 800,
            color: isWinner ? "#10b981" : isLive ? (isSideA ? "#00f0ff" : "#f43f5e") : "#94a3b8",
          }}
        >
          {(credits ?? 10000).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// Status badge for the Hero Duel Marquee
function DuelTeamStatusPill({
  submission,
  delta,
  phase,
  isWinner,
}: {
  submission?: DuelSubmission | null;
  delta?: number;
  phase: string;
  isWinner: boolean;
}) {
  if (isWinner) {
    return (
      <span
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.72rem",
          fontWeight: 800,
          color: "#10b981",
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          padding: "2px 8px",
        }}
      >
        MATCH WINNER
      </span>
    );
  }

  if (phase === "revealed" && typeof delta === "number" && delta !== 0) {
    const isPos = delta > 0;
    return (
      <span
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.75rem",
          fontWeight: 800,
          color: isPos ? "#00ff9d" : "#f43f5e",
          background: isPos ? "rgba(0, 255, 157, 0.12)" : "rgba(244, 63, 94, 0.12)",
          border: `1px solid ${isPos ? "rgba(0, 255, 157, 0.3)" : "rgba(244, 63, 94, 0.3)"}`,
          padding: "2px 8px",
        }}
      >
        {isPos ? `+${delta.toLocaleString()}` : delta.toLocaleString()} CR
      </span>
    );
  }

  if (submission) {
    return (
      <span
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.72rem",
          fontWeight: 800,
          color: "#00ff9d",
          background: "rgba(0, 255, 157, 0.08)",
          border: "1px solid rgba(0, 255, 157, 0.25)",
          padding: "2px 8px",
        }}
      >
        LOCKED IN ({submission.timeTaken || 0}s)
      </span>
    );
  }

  if (phase === "active") {
    return (
      <span
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "#eab308",
          background: "rgba(234, 179, 8, 0.08)",
          border: "1px solid rgba(234, 179, 8, 0.25)",
          padding: "2px 8px",
        }}
      >
        CALCULATING...
      </span>
    );
  }

  return (
    <span
      style={{
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "0.7rem",
        color: "#64748b",
        padding: "2px 6px",
      }}
    >
      STANDBY
    </span>
  );
}

// Seconds formatter (MM:SS)
function formatTime(totalSeconds: number): string {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.max(0, totalSeconds) % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
