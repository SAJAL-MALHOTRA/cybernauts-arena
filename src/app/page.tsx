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
  Activity,
  Check,
  Radio,
  Sliders,
  Crosshair,
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
    round_of_16: "ROUND OF 16 // 8 DUELS",
    quarterfinals: "QUARTERFINALS // 4 DUELS",
    semifinals: "SEMIFINALS // 2 DUELS",
    finals: "GRAND FINALS // 1 DUEL",
    champion: "CHAMPIONSHIP CONCLUDED",
  };

  return (
    <main
      className="bg-tech-grid"
      style={{
        minHeight: "100vh",
        color: "#f4f4f5",
        padding: "2.5rem 1.5rem 5rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* TOP TECHNICAL TICKER */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.45rem 1.25rem",
          background: "#090c12",
          border: "1px solid #1f2839",
          borderLeft: "3px solid #00f0ff",
          borderRadius: "0px",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "#00f0ff",
          letterSpacing: "1.5px",
          marginBottom: "2.5rem",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.6)",
        }}
      >
        <span
          className="animate-pulse-dot"
          style={{
            width: "7px",
            height: "7px",
            background: "#00ff88",
            display: "inline-block",
            boxShadow: "0 0 8px #00ff88",
          }}
        />
        <span>CYBERNAUTS ARENA v2.6 // ENGINE ONLINE // 16 DESK NODES READY</span>
      </motion.div>

      {/* HERO SECTION */}
      <div style={{ maxWidth: "1100px", width: "100%", textAlign: "center", marginBottom: "3.5rem" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Main Title Banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              marginBottom: "1.2rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Shield size={38} color="#00f0ff" strokeWidth={2.2} />
              <h1
                style={{
                  fontSize: "clamp(2.5rem, 6.5vw, 4.5rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.5px",
                  lineHeight: 1.05,
                  color: "#ffffff",
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                CYBERNAUTS <span style={{ color: "#00f0ff" }}>ARENA</span>
              </h1>
              <Swords size={38} color="#ff0055" strokeWidth={2.2} />
            </div>
          </div>

          <p
            style={{
              fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
              color: "#94a3b8",
              maxWidth: "850px",
              margin: "0 auto 2rem auto",
              lineHeight: 1.65,
              fontWeight: 400,
            }}
          >
            Real-time 16-team simultaneous 1v1 cybersecurity & engineering tournament engine.
            Orchestrating synchronized desk stations, sub-second master clocks, and a 5-tier game-theoretic credit economy.
          </p>

          {/* SHARP HUD TELEMETRY BAR */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
              maxWidth: "850px",
              margin: "0 auto",
            }}
          >
            {/* Stage Badge */}
            <div
              style={{
                padding: "0.5rem 1rem",
                background: "#0a0d14",
                border: "1px solid #1c2333",
                borderTop: "2px solid #a855f7",
                borderRadius: "0px",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Activity size={14} color="#a855f7" />
              <span style={{ color: "#71717a", textTransform: "uppercase" }}>STAGE:</span>
              <strong style={{ color: "#ffffff", fontWeight: 700 }}>
                {STAGE_LABELS[systemState.stage] || systemState.stage.toUpperCase()}
              </strong>
            </div>

            {/* Clock Badge */}
            <div
              style={{
                padding: "0.5rem 1rem",
                background: "#0a0d14",
                border: "1px solid #1c2333",
                borderTop: "2px solid #00f0ff",
                borderRadius: "0px",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Clock size={14} color="#00f0ff" />
              <span style={{ color: "#71717a", textTransform: "uppercase" }}>MASTER CLOCK:</span>
              <strong style={{ color: "#00f0ff", fontWeight: 700 }}>{systemState.clockStatus}</strong>
            </div>

            {/* Active Desks Badge */}
            <div
              style={{
                padding: "0.5rem 1rem",
                background: "#0a0d14",
                border: "1px solid #1c2333",
                borderTop: "2px solid #00ff88",
                borderRadius: "0px",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Users size={14} color="#00ff88" />
              <span style={{ color: "#71717a", textTransform: "uppercase" }}>ACTIVE NODES:</span>
              <strong style={{ color: "#00ff88", fontWeight: 700 }}>{systemState.activeTeams} TABLES READY</strong>
            </div>
          </div>
        </motion.div>
      </div>

      {/* THREE MAIN PORTAL CARDS — SHARP EDGES, ZERO BLUR, HIGH CONTRAST */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.75rem",
          maxWidth: "1240px",
          width: "100%",
          marginBottom: "4.5rem",
        }}
      >
        {/* 1. ARENA PROJECTOR CARD — RAZOR CYAN */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            background: "#080a10",
            border: "1px solid #1a2333",
            borderTop: "3px solid #00f0ff",
            borderRadius: "0px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: "0.85rem 1.25rem",
              borderBottom: "1px solid #141b28",
              background: "#0b0e17",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.7rem",
              color: "#00f0ff",
              letterSpacing: "1px",
              fontWeight: 700,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Trophy size={13} color="#00f0ff" />
              <span>FEED // 01</span>
            </span>
            <span style={{ color: "#64748b" }}>STADIUM BROADCAST</span>
          </div>

          <div style={{ padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <h2
              style={{
                fontSize: "1.55rem",
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: "0.75rem",
                letterSpacing: "-0.3px",
              }}
            >
              Esports Arena Projector
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "1.75rem", flexGrow: 1 }}>
              Real-time stadium display engineered for 4K projector feeds. Visualizes 8 simultaneous duel pairings, synchronized master clock, and championship podium.
            </p>

            {/* Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "2rem" }}>
              {[
                "16-Team Dual-Column Knockout Bracket",
                "Millisecond Master Clock Synchronization",
                "Confetti Particle Champion Podium Reveal",
              ].map((feat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    fontSize: "0.84rem",
                    color: "#cbd5e1",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      background: "rgba(0, 240, 255, 0.12)",
                      border: "1px solid #00f0ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={11} color="#00f0ff" strokeWidth={3} />
                  </span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Sharp Action Button */}
            <Link
              href="/bracket"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                background: "#0284c7",
                color: "#ffffff",
                padding: "0.85rem 1rem",
                borderRadius: "0px",
                border: "1px solid #38bdf8",
                textDecoration: "none",
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                fontSize: "0.88rem",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0369a1";
                e.currentTarget.style.borderColor = "#00f0ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0284c7";
                e.currentTarget.style.borderColor = "#38bdf8";
              }}
            >
              <span>[ LAUNCH ARENA PROJECTOR ]</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </motion.div>

        {/* 2. TEAM DESK STATION CARD — ELECTRIC MINT */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            background: "#080a10",
            border: "1px solid #1a2333",
            borderTop: "3px solid #00ff88",
            borderRadius: "0px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: "0.85rem 1.25rem",
              borderBottom: "1px solid #141b28",
              background: "#0b0e17",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.7rem",
              color: "#00ff88",
              letterSpacing: "1px",
              fontWeight: 700,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Cpu size={13} color="#00ff88" />
              <span>TERMINAL // 02</span>
            </span>
            <span style={{ color: "#64748b" }}>DESK WORKSTATION</span>
          </div>

          <div style={{ padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <h2
              style={{
                fontSize: "1.55rem",
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: "0.75rem",
                letterSpacing: "-0.3px",
              }}
            >
              Participant Desk Station
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "1.75rem", flexGrow: 1 }}>
              Secure participant client for team tables (T01 - T16). Features PIN authentication, live problem statement broadcast, Web Audio sound synthesis, and 5-tier outcome reveal.
            </p>

            {/* Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "2rem" }}>
              {[
                "4-Digit Private PIN & Token Authentication",
                "5-Tier Game Theory Matrix (+3,000 to -4,000)",
                "Native Web Audio API Synthesizer Sound FX",
              ].map((feat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    fontSize: "0.84rem",
                    color: "#cbd5e1",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      background: "rgba(0, 255, 136, 0.12)",
                      border: "1px solid #00ff88",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={11} color="#00ff88" strokeWidth={3} />
                  </span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Sharp Action Button */}
            <Link
              href="/team?id=T01"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                background: "#059669",
                color: "#ffffff",
                padding: "0.85rem 1rem",
                borderRadius: "0px",
                border: "1px solid #10b981",
                textDecoration: "none",
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                fontSize: "0.88rem",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#047857";
                e.currentTarget.style.borderColor = "#00ff88";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#059669";
                e.currentTarget.style.borderColor = "#10b981";
              }}
            >
              <span>[ ENTER DESK STATION ]</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </motion.div>

        {/* 3. COMMAND CENTER CARD — CRIMSON LASER */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.15 }}
          style={{
            background: "#080a10",
            border: "1px solid #1a2333",
            borderTop: "3px solid #ff0055",
            borderRadius: "0px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: "0.85rem 1.25rem",
              borderBottom: "1px solid #141b28",
              background: "#0b0e17",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.7rem",
              color: "#ff0055",
              letterSpacing: "1px",
              fontWeight: 700,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Terminal size={13} color="#ff0055" />
              <span>CONSOLE // 03</span>
            </span>
            <span style={{ color: "#64748b" }}>HOST ORCHESTRATION</span>
          </div>

          <div style={{ padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <h2
              style={{
                fontSize: "1.55rem",
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: "0.75rem",
                letterSpacing: "-0.3px",
              }}
            >
              Command Center Console
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "1.75rem", flexGrow: 1 }}>
              Central orchestration console for tournament masters. Dispatch 15 multi-part incident response case studies, control master timer, evaluate submissions, and advance stages.
            </p>

            {/* Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "2rem" }}>
              {[
                "15 Duel Sets & 45 Technical Problems",
                "Master Timer Sync & 2.5s Latency Buffer",
                "Knockout Progression & Host Sheet Print",
              ].map((feat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    fontSize: "0.84rem",
                    color: "#cbd5e1",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      background: "rgba(255, 0, 85, 0.12)",
                      border: "1px solid #ff0055",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={11} color="#ff0055" strokeWidth={3} />
                  </span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Sharp Action Button */}
            <Link
              href="/admin"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                background: "#e11d48",
                color: "#ffffff",
                padding: "0.85rem 1rem",
                borderRadius: "0px",
                border: "1px solid #fb7185",
                textDecoration: "none",
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
                fontSize: "0.88rem",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#be123c";
                e.currentTarget.style.borderColor = "#ff0055";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#e11d48";
                e.currentTarget.style.borderColor = "#fb7185";
              }}
            >
              <span>[ OPEN COMMAND CENTER ]</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ARCHITECTURE & RULES HIGHLIGHT — TECHNICAL 4-COLUMN GRID */}
      <div
        style={{
          maxWidth: "1240px",
          width: "100%",
          background: "#080a10",
          border: "1px solid #1a2333",
          borderRadius: "0px",
          padding: "2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.75rem",
          marginBottom: "3.5rem",
        }}
      >
        {/* 01 */}
        <div style={{ borderLeft: "2px solid #00f0ff", paddingLeft: "1rem" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "#00f0ff",
              letterSpacing: "1px",
              marginBottom: "0.35rem",
            }}
          >
            01 // DISTRIBUTED ARCHITECTURE
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.5rem" }}>
            Sub-Second Sync
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.6 }}>
            Eliminates drift across concurrent wireless devices through authoritative deadline timestamps and client delta compensation.
          </p>
        </div>

        {/* 02 */}
        <div style={{ borderLeft: "2px solid #00ff88", paddingLeft: "1rem" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "#00ff88",
              letterSpacing: "1px",
              marginBottom: "0.35rem",
            }}
          >
            02 // CREDIT ECONOMY
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.5rem" }}>
            5-Tier Game Theory
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.6 }}>
            Scored as Best (+3k), Less-Good (+1.5k), Neutral (0), Less-Bad (-2k), or Worst (-4k). Forces calculated risk under speed constraints.
          </p>
        </div>

        {/* 03 */}
        <div style={{ borderLeft: "2px solid #a855f7", paddingLeft: "1rem" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "#a855f7",
              letterSpacing: "1px",
              marginBottom: "0.35rem",
            }}
          >
            03 // SOUND SYNTHESIS
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.5rem" }}>
            Zero-Asset Web Audio
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.6 }}>
            Native Web Audio API oscillators synthesize heartbeats, countdown bleeps, and outcome fanfares with zero external audio MP3 assets.
          </p>
        </div>

        {/* 04 */}
        <div style={{ borderLeft: "2px solid #f59e0b", paddingLeft: "1rem" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "#f59e0b",
              letterSpacing: "1px",
              marginBottom: "0.35rem",
            }}
          >
            04 // ENGINE RELIABILITY
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.5rem" }}>
            State Persistence
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.6 }}>
            Atomic disk serialization guarantees zero tournament state loss across network hiccups or host server restarts.
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer
        style={{
          textAlign: "center",
          color: "#64748b",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.75rem",
          letterSpacing: "0.5px",
        }}
      >
        CYBERNAUTS ARENA // ENGINEERED FOR HIGH-STAKES CODING & CYBERSECURITY DUELS
      </footer>
    </main>
  );
}
