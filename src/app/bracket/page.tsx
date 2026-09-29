"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Trophy,
  Swords,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Shield,
  Code,
  Flame,
  ChevronRight,
  Terminal,
  Sparkles,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  score: number;
  seed: number;
  members: string;
  color: string;
}

interface Duel {
  id: string;
  stage: string;
  duelNumber: number;
  teamA: Team | null;
  teamB: Team | null;
  creditsA: number;
  creditsB: number;
  scoreA: number;
  scoreB: number;
  winner: Team | null;
  status: "pending" | "in_progress" | "round_evaluated" | "completed";
}

interface TournamentState {
  tournamentName: string;
  currentStage: "round_of_16" | "quarterfinals" | "semifinals" | "finals" | "champion";
  stages: string[];
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
    title: string;
    category: string;
    question: string;
  } | null;
  champion: Team | null;
  serverTime: number;
}

function getApiBaseUrl() {
  return "";
}

export default function BracketProjectorPage() {
  const [data, setData] = useState<TournamentState | null>(null);
  const [clientRemaining, setClientRemaining] = useState(45);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  const fetchState = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/tournament/state`);
      if (res.ok) {
        const state: TournamentState = await res.json();
        setData(state);

        if (state.timer.status === "running" && state.timer.deadline) {
          const rem = Math.max(0, Math.ceil((state.timer.deadline - Date.now()) / 1000));
          setClientRemaining(rem);
        } else {
          setClientRemaining(state.timer.remainingSeconds || 0);
        }

        if (state.champion && !hasCelebrated) {
          setHasCelebrated(true);
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
        }
      }
    } catch (err) {
      console.warn("Bracket state error:", err);
    }
  };

  useEffect(() => {
    document.title = "CYBERNAUTS | Live Arena Bracket";
    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, [hasCelebrated]);

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading Tournament Arena...
      </div>
    );
  }

  const STAGE_TITLES: Record<string, string> = {
    round_of_16: "Round of 16",
    quarterfinals: "Quarterfinals",
    semifinals: "Semifinals",
    finals: "Grand Finals",
    champion: "Champion",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090b",
        color: "#f4f4f5",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* ARENA HEADER BANNER */}
      <div
        style={{
          maxWidth: "1400px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.5rem",
          background: "#121215",
          borderRadius: "18px",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          marginBottom: "1.5rem",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Terminal size={24} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "2px" }}>
              CYBERNAUTS CODE HUNT • ROUND 2
            </div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff", margin: 0 }}>
              16-Team 1v1 Simultaneous Duel Arena
            </h1>
          </div>
        </div>

        {/* CURRENT STAGE & MASTER TIMER PILL */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "12px",
              background: "#18181b",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.68rem", color: "#a1a1aa", fontWeight: 700, textTransform: "uppercase" }}>ACTIVE STAGE</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#38bdf8" }}>
              {STAGE_TITLES[data.currentStage] || data.currentStage}
            </div>
          </div>

          <div
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "12px",
              background: data.timer.status === "running" ? "rgba(56, 189, 248, 0.15)" : "#18181b",
              border: `1px solid ${data.timer.status === "running" ? "#38bdf8" : "rgba(255, 255, 255, 0.1)"}`,
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <Clock size={20} color={data.timer.status === "running" ? "#38bdf8" : "#a1a1aa"} />
            <div>
              <div style={{ fontSize: "0.68rem", color: "#a1a1aa", fontWeight: 700, textTransform: "uppercase" }}>SYNC TIMER</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 900, color: data.timer.status === "running" ? "#38bdf8" : "#ffffff" }}>
                {clientRemaining}s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHAMPION PODIUM BANNER (IF TOURNAMENT CONCLUDED) */}
      {data.champion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            maxWidth: "1400px",
            width: "100%",
            background: "linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(234, 179, 8, 0.05) 100%)",
            border: "2px solid #eab308",
            borderRadius: "20px",
            padding: "2rem",
            textAlign: "center",
            marginBottom: "1.5rem",
            boxShadow: "0 0 50px rgba(234, 179, 8, 0.3)",
          }}
        >
          <Trophy size={48} color="#eab308" style={{ margin: "0 auto 0.75rem auto" }} />
          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#eab308", letterSpacing: "2px", textTransform: "uppercase" }}>
            CYBERNAUTS CHAMPIONS
          </div>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#ffffff", margin: "0.25rem 0" }}>
            🏆 {data.champion.name} 🏆
          </h2>
          <p style={{ color: "#fde047", fontWeight: 700, margin: 0 }}>
            Winner of all 4 Knockout Rounds ({data.champion.id})
          </p>
        </motion.div>
      )}

      {/* 5-TIER OUTCOMES RULE BAR FOR ARENA SPECTATORS */}
      <div
        style={{
          maxWidth: "1400px",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1.2fr 2fr",
          alignItems: "center",
          gap: "1rem",
          background: "#121215",
          borderRadius: "14px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "0.85rem 1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.2rem" }}>🪙</span>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 900, color: "#ffffff" }}>
              Starting Bank: 10,000 Credits
            </div>
            <div style={{ fontSize: "0.72rem", color: "#a1a1aa" }}>
              Teams choose from 5 options per statement (30s timer). Highest credit balance advances!
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.4rem", textAlign: "center" }}>
          <div style={{ padding: "0.35rem", borderRadius: "6px", background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", fontWeight: 800, fontSize: "0.75rem" }}>
            Best: +3,000
          </div>
          <div style={{ padding: "0.35rem", borderRadius: "6px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", fontWeight: 800, fontSize: "0.75rem" }}>
            Less-Good: +1,500
          </div>
          <div style={{ padding: "0.35rem", borderRadius: "6px", background: "rgba(255, 255, 255, 0.05)", color: "#a1a1aa", fontWeight: 800, fontSize: "0.75rem" }}>
            Neutral: 0
          </div>
          <div style={{ padding: "0.35rem", borderRadius: "6px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", fontWeight: 800, fontSize: "0.75rem" }}>
            Less-Bad: -2,000
          </div>
          <div style={{ padding: "0.35rem", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", fontWeight: 800, fontSize: "0.75rem" }}>
            Worst: -4,000
          </div>
        </div>
      </div>

      {/* 16-TEAM TOURNAMENT BRACKET GRID */}
      <div
        style={{
          maxWidth: "1400px",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1.2fr 1.2fr 1.2fr 1.2fr",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        {/* COLUMN 1: ROUND OF 16 (8 DUELS) */}
        <div>
          <div style={{ padding: "0.6rem 1rem", borderRadius: "10px", background: "#18181b", textAlign: "center", fontWeight: 800, fontSize: "0.85rem", color: "#38bdf8", marginBottom: "0.75rem" }}>
            Round of 16 (8 Duels)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {data.bracket.round_of_16.map((duel) => (
              <DuelCard key={duel.id} duel={duel} isCurrentStage={data.currentStage === "round_of_16"} />
            ))}
          </div>
        </div>

        {/* COLUMN 2: QUARTERFINALS (4 DUELS) */}
        <div>
          <div style={{ padding: "0.6rem 1rem", borderRadius: "10px", background: "#18181b", textAlign: "center", fontWeight: 800, fontSize: "0.85rem", color: "#a855f7", marginBottom: "0.75rem" }}>
            Quarterfinals (4 Duels)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
            {data.bracket.quarterfinals.map((duel) => (
              <DuelCard key={duel.id} duel={duel} isCurrentStage={data.currentStage === "quarterfinals"} />
            ))}
          </div>
        </div>

        {/* COLUMN 3: SEMIFINALS (2 DUELS) */}
        <div>
          <div style={{ padding: "0.6rem 1rem", borderRadius: "10px", background: "#18181b", textAlign: "center", fontWeight: 800, fontSize: "0.85rem", color: "#ec4899", marginBottom: "0.75rem" }}>
            Semifinals (2 Duels)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem", marginTop: "3rem" }}>
            {data.bracket.semifinals.map((duel) => (
              <DuelCard key={duel.id} duel={duel} isCurrentStage={data.currentStage === "semifinals"} />
            ))}
          </div>
        </div>

        {/* COLUMN 4: GRAND FINALS (1 DUEL) */}
        <div>
          <div style={{ padding: "0.6rem 1rem", borderRadius: "10px", background: "#18181b", textAlign: "center", fontWeight: 800, fontSize: "0.85rem", color: "#eab308", marginBottom: "0.75rem" }}>
            Grand Finals
          </div>
          <div style={{ marginTop: "7.5rem" }}>
            {data.bracket.finals.map((duel) => (
              <DuelCard key={duel.id} duel={duel} isCurrentStage={data.currentStage === "finals"} isFinal />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Duel Card for Bracket
function DuelCard({ duel, isCurrentStage, isFinal }: { duel: Duel; isCurrentStage: boolean; isFinal?: boolean }) {
  const isLive = isCurrentStage && duel.status === "in_progress";

  return (
    <div
      style={{
        background: isLive ? "#18181b" : "#121215",
        borderRadius: "14px",
        border: `1.5px solid ${
          duel.winner
            ? "#22c55e40"
            : isLive
            ? "#38bdf8"
            : "rgba(255, 255, 255, 0.08)"
        }`,
        padding: "0.85rem 1rem",
        boxShadow: isLive ? "0 0 20px rgba(56, 189, 248, 0.25)" : "none",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.7rem", color: "#71717a", fontWeight: 800 }}>
          {duel.id}
        </span>
        {isLive ? (
          <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", borderRadius: "4px", background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", fontWeight: 800 }}>
            LIVE ⚔️
          </span>
        ) : duel.winner ? (
          <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", borderRadius: "4px", background: "rgba(34, 197, 94, 0.2)", color: "#22c55e", fontWeight: 800 }}>
            COMPLETED
          </span>
        ) : (
          <span style={{ fontSize: "0.65rem", color: "#52525b", fontWeight: 700 }}>PENDING</span>
        )}
      </div>

      {/* TEAM A */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.4rem 0.6rem",
          borderRadius: "8px",
          background: duel.winner?.id === duel.teamA?.id ? "rgba(34, 197, 94, 0.15)" : "#09090b",
          marginBottom: "0.35rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: duel.teamA?.color || "#52525b" }} />
          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: duel.teamA ? "#ffffff" : "#71717a", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
            {duel.teamA ? duel.teamA.name : "TBD"}
          </span>
        </div>
        <span style={{ fontSize: "0.85rem", fontWeight: 900, color: duel.winner?.id === duel.teamA?.id ? "#22c55e" : "#eab308" }}>
          {(duel.creditsA ?? 10000).toLocaleString()} cr
        </span>
      </div>

      {/* TEAM B */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.4rem 0.6rem",
          borderRadius: "8px",
          background: duel.winner?.id === duel.teamB?.id ? "rgba(34, 197, 94, 0.15)" : "#09090b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: duel.teamB?.color || "#52525b" }} />
          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: duel.teamB ? "#ffffff" : "#71717a", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
            {duel.teamB ? duel.teamB.name : "TBD"}
          </span>
        </div>
        <span style={{ fontSize: "0.85rem", fontWeight: 900, color: duel.winner?.id === duel.teamB?.id ? "#22c55e" : "#eab308" }}>
          {(duel.creditsB ?? 10000).toLocaleString()} cr
        </span>
      </div>
    </div>
  );
}
