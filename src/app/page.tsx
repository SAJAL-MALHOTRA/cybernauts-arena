"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Swords,
  Clock,
  Shield,
  Zap,
  Terminal,
  Cpu,
  Server,
  Users,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Activity,
  Flame,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  const [systemState, setSystemState] = useState<{
    stage: string;
    phase: string;
    activeTeams: number;
    clockStatus: string;
  }>({
    stage: "round_of_16",
    phase: "idle",
    activeTeams: 16,
    clockStatus: "STANDBY",
  });

  useEffect(() => {
    fetch("/api/tournament/state")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setSystemState({
            stage: data.currentStage || "round_of_16",
            phase: data.phase || "idle",
            activeTeams: data.teams ? data.teams.length : 16,
            clockStatus: data.timer?.status ? data.timer.status.toUpperCase() : "IDLE",
          });
        }
      })
      .catch(() => {});
  }, []);

  const STAGE_LABELS: Record<string, string> = {
    round_of_16: "Round of 16 (8 Duels)",
    quarterfinals: "Quarterfinals (4 Duels)",
    semifinals: "Semifinals (2 Duels)",
    finals: "Grand Finals (1 Duel)",
    champion: "Tournament Concluded",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #131722 0%, #08090d 100%)",
        color: "#f4f4f5",
        padding: "2rem 1.5rem 4rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* TOP STATUS TICKER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.4rem 1rem",
          background: "rgba(56, 189, 248, 0.08)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: "9999px",
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "#38bdf8",
          letterSpacing: "1px",
          marginBottom: "2rem",
          boxShadow: "0 0 20px rgba(56, 189, 248, 0.15)",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 10px #22c55e",
          }}
        />
        CYBERNAUTS ARENA ENGINE ONLINE // 16 DESK NODES READY
      </motion.div>

      {/* HERO SECTION */}
      <div style={{ maxWidth: "1000px", textAlign: "center", marginBottom: "3rem" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <Shield size={36} color="#38bdf8" />
            <h1
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4.2rem)",
                fontWeight: 900,
                letterSpacing: "-1px",
                lineHeight: 1.1,
                background: "linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: 0,
              }}
            >
              CYBERNAUTS <span style={{ color: "#38bdf8", WebkitTextFillColor: "#38bdf8" }}>ARENA</span>
            </h1>
            <Swords size={36} color="#f43f5e" />
          </div>

          <p
            style={{
              fontSize: "clamp(1.05rem, 2vw, 1.35rem)",
              color: "#94a3b8",
              maxWidth: "800px",
              margin: "0 auto 1.5rem auto",
              lineHeight: 1.6,
            }}
          >
            Real-time 16-team simultaneous 1v1 cybersecurity & engineering tournament engine.
            Orchestrating synchronized desk stations, sub-second master clocks, and a 5-tier game-theoretic credit economy.
          </p>

          {/* TELEMETRY BADGES */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "8px",
                background: "#18181b",
                border: "1px solid #27272a",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Activity size={14} color="#a855f7" />
              <span style={{ color: "#a1a1aa" }}>Stage:</span>
              <strong style={{ color: "#ffffff" }}>{STAGE_LABELS[systemState.stage] || systemState.stage}</strong>
            </div>
            <div
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "8px",
                background: "#18181b",
                border: "1px solid #27272a",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Clock size={14} color="#38bdf8" />
              <span style={{ color: "#a1a1aa" }}>Clock:</span>
              <strong style={{ color: "#38bdf8" }}>{systemState.clockStatus}</strong>
            </div>
            <div
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "8px",
                background: "#18181b",
                border: "1px solid #27272a",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Users size={14} color="#22c55e" />
              <span style={{ color: "#a1a1aa" }}>Active Desks:</span>
              <strong style={{ color: "#22c55e" }}>{systemState.activeTeams} Teams</strong>
            </div>
          </div>
        </motion.div>
      </div>

      {/* THREE MAIN PORTAL CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          maxWidth: "1200px",
          width: "100%",
          marginBottom: "4rem",
        }}
      >
        {/* 1. ARENA PROJECTOR */}
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          style={{
            background: "linear-gradient(180deg, #181920 0%, #0f1015 100%)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: "20px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "150px",
              height: "150px",
              background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "#38bdf8",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "1rem",
            }}
          >
            <Trophy size={14} /> Stage / Stadium Display
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.75rem" }}>
            Esports Arena Projector
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1.5rem", flexGrow: 1 }}>
            Real-time stadium display engineered for 4K projector feeds. Visualizes 8 simultaneous duel pairings, synchronized master clock, and championship podium.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#e4e4e7" }}>
              <CheckCircle2 size={16} color="#38bdf8" /> 16-Team Dual-Column Knockout Bracket
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#e4e4e7" }}>
              <CheckCircle2 size={16} color="#38bdf8" /> Millisecond Master Clock Sync
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#e4e4e7" }}>
              <CheckCircle2 size={16} color="#38bdf8" /> Confetti Particle Champion Podium
            </div>
          </div>

          <Link
            href="/bracket"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "#ffffff",
              padding: "0.9rem",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "1rem",
              boxShadow: "0 4px 20px rgba(2, 132, 199, 0.4)",
            }}
          >
            Launch Arena Projector <ChevronRight size={18} />
          </Link>
        </motion.div>

        {/* 2. TEAM DESK STATION */}
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          style={{
            background: "linear-gradient(180deg, #181920 0%, #0f1015 100%)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            borderRadius: "20px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "150px",
              height: "150px",
              background: "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "#a855f7",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "1rem",
            }}
          >
            <Cpu size={14} /> Participant Workstation
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.75rem" }}>
            Participant Desk Station
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1.5rem", flexGrow: 1 }}>
            Secure participant client for team tables (T01 - T16). Features PIN authentication, live problem statement broadcast, Web Audio sound synthesis, and 5-tier outcome reveal.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#e4e4e7" }}>
              <CheckCircle2 size={16} color="#a855f7" /> 4-Digit Private PIN & Token Authentication
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#a855f7" }}>
              <CheckCircle2 size={16} color="#a855f7" /> 5-Tier Outcome Card (+3,000 to -4,000)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#e4e4e7" }}>
              <CheckCircle2 size={16} color="#a855f7" /> Custom Web Audio Synthesizer Sound FX
            </div>
          </div>

          <Link
            href="/team?id=T01"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              background: "linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)",
              color: "#ffffff",
              padding: "0.9rem",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "1rem",
              boxShadow: "0 4px 20px rgba(147, 51, 234, 0.4)",
            }}
          >
            Enter Desk Station <ChevronRight size={18} />
          </Link>
        </motion.div>

        {/* 3. ADMIN COMMAND CENTER */}
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ duration: 2 }}
          style={{
            background: "linear-gradient(180deg, #181920 0%, #0f1015 100%)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: "20px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "150px",
              height: "150px",
              background: "radial-gradient(circle, rgba(244, 63, 94, 0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "#f43f5e",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "1rem",
            }}
          >
            <Terminal size={14} /> Orchestration Cockpit
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.75rem" }}>
            Command Center Console
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1.5rem", flexGrow: 1 }}>
            Central orchestration console for tournament masters. Dispatch 15 multi-part incident response case studies, control master timer, evaluate submissions, and advance stages.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#e4e4e7" }}>
              <CheckCircle2 size={16} color="#f43f5e" /> 15 Duel Sets & 45 Technical Problems
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#e4e4e7" }}>
              <CheckCircle2 size={16} color="#f43f5e" /> Master Timer Sync & 2.5s Latency Buffer
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#e4e4e7" }}>
              <CheckCircle2 size={16} color="#f43f5e" /> Knockout Progression & Winner Overrides
            </div>
          </div>

          <Link
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
              color: "#ffffff",
              padding: "0.9rem",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "1rem",
              boxShadow: "0 4px 20px rgba(225, 29, 72, 0.4)",
            }}
          >
            Open Command Center <ChevronRight size={18} />
          </Link>
        </motion.div>
      </div>

      {/* ARCHITECTURE & RULES HIGHLIGHT */}
      <div
        style={{
          maxWidth: "1200px",
          width: "100%",
          background: "rgba(18, 19, 26, 0.6)",
          border: "1px solid #27272a",
          borderRadius: "20px",
          padding: "2.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "2rem",
          marginBottom: "3rem",
        }}
      >
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#38bdf8", letterSpacing: "1px" }}>
            ENGINEERING ARCHITECTURE
          </div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", margin: "0.4rem 0 0.8rem 0" }}>
            Sub-Second Distributed Sync
          </h3>
          <p style={{ color: "#a1a1aa", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Eliminates drift across concurrent wireless devices through authoritative deadline timestamps and client delta compensation.
          </p>
        </div>

        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#22c55e", letterSpacing: "1px" }}>
            CREDIT MATRIX
          </div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", margin: "0.4rem 0 0.8rem 0" }}>
            5-Tier Game Theory
          </h3>
          <p style={{ color: "#a1a1aa", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Options scored as Best (+3k), Less-Good (+1.5k), Neutral (0), Less-Bad (-2k), or Catastrophic (-4k). Forces strategic risk calculation under time pressure.
          </p>
        </div>

        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#a855f7", letterSpacing: "1px" }}>
            AUDIO SYNTHESIS
          </div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", margin: "0.4rem 0 0.8rem 0" }}>
            Zero-Asset Web Audio
          </h3>
          <p style={{ color: "#a1a1aa", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Native Web Audio API oscillators synthesize heartbeats, countdown bleeps, and outcome fanfares with zero external audio assets.
          </p>
        </div>

        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#f59e0b", letterSpacing: "1px" }}>
            INFRASTRUCTURE
          </div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", margin: "0.4rem 0 0.8rem 0" }}>
            State Persistence
          </h3>
          <p style={{ color: "#a1a1aa", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Atomic disk serialization guarantees zero tournament state loss across network hiccups or host server restarts.
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", color: "#71717a", fontSize: "0.85rem" }}>
        Cybernauts Arena Tournament Platform · Engineered for High-Stakes Coding & Cybersecurity Duels
      </footer>
    </main>
  );
}
