"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Swords,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Eye,
  Send,
  Zap,
  BookOpen,
  Users,
  Clock,
  ArrowRight,
  Shield,
  Lock,
  Unlock,
  Edit3,
  Check,
  X,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  pin: string;
  token: string;
  credits: number;
  multiplier?: number;
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
  roundDeltaA: number;
  roundDeltaB: number;
  questionsAnswered?: number;
  totalQuestions?: number;
  winner: Team | null;
  status: string;
  currentRoundSubmissions: {
    teamA: { optionIndex: number; outcome: string; creditChange: number; timeTaken: number; submittedAt: number } | null;
    teamB: { optionIndex: number; outcome: string; creditChange: number; timeTaken: number; submittedAt: number } | null;
  };
  history: any[];
}

interface Question {
  id: number;
  duelNumber?: number;
  duelTitle?: string;
  caseStudy?: string;
  mission?: string;
  questionNumber?: number;
  title: string;
  category: string;
  code?: string;
  question: string;
  options: Array<{ text: string; outcome: string }>;
  explanation?: string;
}

interface DuelQuestion {
  id: number;
  questionNumber: number;
  question: string;
  options: any[];
  explanation?: string;
}

interface DuelSet {
  duelNumber: number;
  title: string;
  caseStudy: string;
  mission: string;
  questions: DuelQuestion[];
}

interface PresenceEntry {
  id: string;
  name: string;
  color: string;
  status: "live" | "stale" | "offline";
  lastSeenAgo: number | null;
}

interface TournamentState {
  tournamentName: string;
  currentStage: string;
  stages: string[];
  phase: "idle" | "question_incoming" | "active" | "locked" | "revealed";
  creditRules: Record<string, number>;
  startingCredits: number;
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
  activeQuestion: Question | null;
  questionsCount: number;
  champion: Team | null;
  presence: PresenceEntry[];
  serverTime: number;
}

function getApiBaseUrl() {
  return "";
}

// Injects x-admin-key on every mutating admin request
function adminFetch(url: string, passcode: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": passcode,
      ...(options.headers || {}),
    },
  });
}

const STAGE_CONFIG: Record<string, { label: string; count: number; nextLabel?: string }> = {
  round_of_16: { label: "Round of 16", count: 8, nextLabel: "Quarterfinals" },
  quarterfinals: { label: "Quarterfinals", count: 4, nextLabel: "Semifinals" },
  semifinals: { label: "Semifinals", count: 2, nextLabel: "Grand Finals" },
  finals: { label: "Grand Finals", count: 1, nextLabel: "Conclude Tournament" },
  champion: { label: "Tournament Concluded", count: 0 },
};

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export default function CybernautsAdminPage() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [alertModal, setAlertModal] = useState<{ title: string; message: string; type: "info" | "warning" } | null>(null);

  const triggerToast = (text: string, type: "success" | "info" = "success") => {
    setToast({ message: text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ title, message, onConfirm });
  };

  const showAlert = (title: string, message: string, type: "info" | "warning" = "info") => {
    setAlertModal({ title, message, type });
  };
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [duelSets, setDuelSets] = useState<DuelSet[]>([]);
  const [selectedDuelNumber, setSelectedDuelNumber] = useState<number>(1);
  const [clientRemaining, setClientRemaining] = useState<number>(30);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("random");
  const [navTab, setNavTab] = useState<"control" | "questions" | "teams">("control");
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [adminPasscode, setAdminPasscode] = useState<string>("");
  const [passcodeError, setPasscodeError] = useState<string>("");

  // Custom Team Names Editing State
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState<string>("");
  const [showBatchRenameModal, setShowBatchRenameModal] = useState<boolean>(false);
  const [batchTeamsList, setBatchTeamsList] = useState<Array<{ id: string; name: string }>>([]);
  const [bulkPasteText, setBulkPasteText] = useState<string>("");

  const handleSaveSingleTeam = async (teamId: string, name: string) => {
    try {
      const cleanName = name.trim();
      if (!cleanName) return;
      const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/update-team`, adminPasscode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, name: cleanName }),
      });
      if (res.ok) {
        setEditingTeamId(null);
        triggerToast(`Renamed ${teamId} to "${cleanName}"`);
        pollTournament();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenBatchRename = () => {
    if (!tournament) return;
    setBatchTeamsList(tournament.teams.map((t) => ({ id: t.id, name: t.name })));
    setBulkPasteText("");
    setShowBatchRenameModal(true);
  };

  const handleApplyBulkPaste = () => {
    if (!bulkPasteText.trim()) return;
    const lines = bulkPasteText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setBatchTeamsList((prev) =>
      prev.map((item, idx) => ({
        ...item,
        name: lines[idx] ? lines[idx] : item.name,
      }))
    );
    triggerToast(`Applied ${Math.min(lines.length, 16)} names from pasted text.`);
  };

  const handleSaveBatchRename = async () => {
    try {
      setIsSubmittingAction(true);
      const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/update-teams-batch`, adminPasscode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teams: batchTeamsList }),
      });
      if (res.ok) {
        setShowBatchRenameModal(false);
        triggerToast("Saved all 16 team names successfully!");
        pollTournament();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPasscode = sessionStorage.getItem("cybernauts_admin_passcode");
      if (savedPasscode) {
        setAdminPasscode(savedPasscode);
        setIsAdminUnlocked(true);
      }
    }
  }, []);

  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = adminPasscode.trim();
    if (!p) {
      setPasscodeError("Enter the organizer passcode.");
      return;
    }
    // Validate against server — try a protected endpoint
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/tournament/host-sheet`, {
        headers: { "x-admin-key": p },
      });
      if (res.ok) {
        setIsAdminUnlocked(true);
        setPasscodeError("");
        sessionStorage.setItem("cybernauts_admin_passcode", p);
        triggerToast("Admin Console Unlocked!");
      } else {
        setPasscodeError("Invalid passcode — server rejected it.");
      }
    } catch {
      // Fallback: accept if server unreachable (dev mode)
      setIsAdminUnlocked(true);
      setPasscodeError("");
      sessionStorage.setItem("cybernauts_admin_passcode", p);
      triggerToast("Admin Console Unlocked (offline mode).");
    }
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    setAdminPasscode("");
    sessionStorage.removeItem("cybernauts_admin_passcode");
    triggerToast("Admin Console Locked.", "info");
  };

  const pollTournament = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/tournament/state`);
      if (res.ok) {
        const data: TournamentState = await res.json();
        setTournament(data);

        if (data.timer.status === "running" && data.timer.deadline) {
          const rem = Math.max(0, Math.ceil((data.timer.deadline - Date.now()) / 1000));
          setClientRemaining(rem);
        } else {
          setClientRemaining(data.timer.remainingSeconds || 0);
        }
      }
    } catch (err) {
      console.warn("Poll tournament error:", err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const [qRes, dRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/api/tournament/questions`),
        fetch(`${getApiBaseUrl()}/api/tournament/duel-sets`),
      ]);
      if (qRes.ok) {
        const data = await qRes.json();
        setQuestions(data.questions || []);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setDuelSets(dData.duelSets || []);
      }
    } catch (err) {
      console.warn("Fetch questions error:", err);
    }
  };

  useEffect(() => {
    pollTournament();
    fetchQuestions();
    const interval = setInterval(pollTournament, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (tournament && tournament.timer.status === "running" && tournament.timer.deadline) {
        const rem = Math.max(0, Math.ceil((tournament.timer.deadline - Date.now()) / 1000));
        setClientRemaining(rem);
      }
    }, 250);
    return () => clearInterval(timerInterval);
  }, [tournament]);

  // Actions
  const handlePushQuestion = async () => {
    try {
      setIsSubmittingAction(true);
      const qId = selectedQuestionId === "random" ? null : Number(selectedQuestionId);
      const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/push-question`, adminPasscode, {
        method: "POST",
        body: JSON.stringify({ questionId: qId }),
      });
      if (res.ok) {
        triggerToast("Question pushed to participant stations.");
        pollTournament();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleStartTimer = async (seconds: number = 30) => {
    try {
      setIsSubmittingAction(true);
      const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/start-timer`, adminPasscode, {
        method: "POST",
        body: JSON.stringify({ duration: seconds }),
      });
      if (res.ok) {
        triggerToast(`Timer started: ${seconds}s`);
        pollTournament();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handlePushAndStart = async (seconds: number = 30) => {
    try {
      setIsSubmittingAction(true);
      const qId = selectedQuestionId === "random" ? null : Number(selectedQuestionId);
      const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/push-and-start`, adminPasscode, {
        method: "POST",
        body: JSON.stringify({ questionId: qId, duration: seconds }),
      });
      if (res.ok) {
        triggerToast(`Pushed & started ${seconds}s clock.`);
        pollTournament();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handlePushDuelQuestion = async (qId: number, duration: number = 30) => {
    try {
      setIsSubmittingAction(true);
      const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/push-and-start`, adminPasscode, {
        method: "POST",
        body: JSON.stringify({ questionId: qId, duration }),
      });
      if (res.ok) {
        triggerToast(`Launched Question #${qId} (30s timer active)!`);
        pollTournament();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRevealOutcomes = async () => {
    try {
      setIsSubmittingAction(true);
      const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/reveal-outcomes`, adminPasscode, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (res.ok) {
        triggerToast("Outcomes revealed: credit deltas committed and broadcasted.");
        pollTournament();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleTimerAction = async (action: string, seconds: number = 10) => {
    try {
      const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/timer-action`, adminPasscode, {
        method: "POST",
        body: JSON.stringify({ action, seconds }),
      });
      if (res.ok) {
        pollTournament();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdvanceStage = () => {
    if (!tournament) return;
    const currentDuels = tournament.activeDuels || [];
    const uncompleted = currentDuels.filter((d) => !d.winner);

    if (uncompleted.length > 0) {
      return showAlert(
        "Cannot Advance Stage",
        `${uncompleted.length} duel(s) do not have a declared winner yet. Make sure all outcomes are evaluated or declare winners before advancing.`,
        "warning"
      );
    }

    const currentConf = STAGE_CONFIG[tournament.currentStage] || { label: tournament.currentStage, nextLabel: "Next Stage" };
    showConfirm(
      "Advance Tournament Stage",
      `Promote winning teams from ${currentConf.label} to ${currentConf.nextLabel || "the next round"}?`,
      async () => {
        try {
          const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/advance-stage`, adminPasscode, {
            method: "POST",
            body: JSON.stringify({}),
          });
          const result = await res.json();
          if (result.success) {
            triggerToast(`Advanced to ${result.currentStage.toUpperCase()}`);
            pollTournament();
          } else {
            showAlert("Advance Failed", result.message || "Unknown error", "warning");
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const handleSetDuelWinner = async (duelId: string, winnerTeamId: string, teamName: string) => {
    try {
      const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/set-duel-winner`, adminPasscode, {
        method: "POST",
        body: JSON.stringify({ duelId, winnerTeamId }),
      });
      if (res.ok) {
        triggerToast(`Awarded match to ${teamName}`);
        pollTournament();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetTournament = (reseed: boolean = false) => {
    showConfirm(
      reseed ? "Re-seed Tournament" : "Reset Tournament Credits",
      reseed
        ? "This will re-seed all 16 teams with fresh brackets and 10,000 starting credits at Round of 16. NEW PINs will be generated — print the host sheet afterwards. Proceed?"
        : "This will reset all team credit balances to 10,000 and restart at Round of 16. NEW PINs will be generated — print the host sheet afterwards. Proceed?",
      async () => {
        try {
          const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/reset`, adminPasscode, {
            method: "POST",
            body: JSON.stringify({ reseed }),
          });
          if (res.ok) {
            triggerToast("Tournament reset — new PINs generated. Print the host sheet!");
            pollTournament();
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const handleResetBalances = () => {
    showConfirm(
      "Reset All Balances to 10,000",
      "This will reset all team credit balances and match scores across all duels to 10,000 CR without altering stages or matchups. Proceed?",
      async () => {
        try {
          setIsSubmittingAction(true);
          const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/reset-balances`, adminPasscode, {
            method: "POST",
            body: JSON.stringify({ amount: 10000 }),
          });
          if (res.ok) {
            triggerToast("All team balances reset to 10,000 CR!");
            pollTournament();
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsSubmittingAction(false);
        }
      }
    );
  };

  const handleMoveToRound2 = () => {
    showConfirm(
      "Sync Points & Move to Round 2",
      "Advance tournament to Round 2 (Quarterfinals) carrying over all accumulated team points from Round 1?",
      async () => {
        try {
          setIsSubmittingAction(true);
          const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/move-to-round-2`, adminPasscode, {
            method: "POST",
            body: JSON.stringify({}),
          });
          const result = await res.json();
          if (result.success) {
            triggerToast("Round 2 (Quarterfinals) active with all points synced!");
            pollTournament();
          } else {
            showAlert("Error", result.message || "Failed to sync to Round 2", "warning");
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsSubmittingAction(false);
        }
      }
    );
  };

  const handleMoveToSemifinals = () => {
    showConfirm(
      "Sync Points & Move to Semifinals (4 Teams)",
      "Activate the 4 Semifinalists (HACK3RS, CODEHUB, TEAM DIAMOND, BINARY BRAIN) and sync points?",
      async () => {
        try {
          setIsSubmittingAction(true);
          const res = await adminFetch(`${getApiBaseUrl()}/api/tournament/move-to-semifinals`, adminPasscode, {
            method: "POST",
            body: JSON.stringify({}),
          });
          const result = await res.json();
          if (result.success) {
            triggerToast("Semifinals (4 Teams Remaining) active with synced points!");
            pollTournament();
          } else {
            showAlert("Error", result.message || "Failed to move to Semifinals", "warning");
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsSubmittingAction(false);
        }
      }
    );
  };

  // Print the host credential sheet
  const handlePrintHostSheet = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/tournament/host-sheet`, {
        headers: { "x-admin-key": adminPasscode },
      });
      if (!res.ok) {
        triggerToast("Could not fetch host sheet — check passcode.", "info");
        return;
      }
      const data = await res.json();
      const teams: Array<{ id: string; name: string; members: string; seed: number; pin: string; token: string }> = data.teams;
      const html = `<!DOCTYPE html><html><head><title>CYBERNAUTS HOST SHEET</title>
<style>
  body { font-family: monospace; padding: 2rem; background: #fff; color: #000; }
  h1 { font-size: 1.4rem; text-align: center; margin-bottom: 1rem; }
  p.note { text-align: center; color: #666; font-size: 0.8rem; margin-bottom: 1.5rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th { background: #111; color: #fff; padding: 8px 12px; text-align: left; }
  td { border: 1px solid #ccc; padding: 8px 12px; }
  tr:nth-child(even) td { background: #f7f7f7; }
  .pin { font-size: 1.3rem; font-weight: bold; letter-spacing: 0.2em; }
  @media print { body { padding: 0; } }
</style>
</head><body>
<h1>⚡ CYBERNAUTS ARENA — HOST CREDENTIAL SHEET</h1>
<p class="note">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; CONFIDENTIAL — DO NOT DISTRIBUTE</p>
<table>
<thead><tr><th>Team ID</th><th>Name</th><th>Table / Members</th><th>Seed</th><th class="pin">PIN</th><th>Token (backup)</th></tr></thead>
<tbody>
${teams.map((t) => `<tr><td>${t.id}</td><td>${t.name}</td><td>${t.members}</td><td>${t.seed}</td><td class="pin">${t.pin}</td><td style="font-size:0.7rem">${t.token}</td></tr>`).join("")}
</tbody>
</table>
<p class="note" style="margin-top:1rem">Destroy after event. PINs rotate on next reset.</p>
</body></html>`;
      const win = window.open("", "_blank", "width=900,height=700");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 400);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to open host sheet.", "info");
    }
  };

  if (!tournament) {
    return (
      <div style={{ color: "#71717a", padding: "4rem 2rem", textAlign: "center", fontFamily: "var(--font-mono, monospace)", fontSize: "0.85rem" }}>
        CONNECTING TO CYBERNAUTS EVENT CONSOLE...
      </div>
    );
  }

  const isTimerRunning = tournament.timer.status === "running";
  const isTimerPaused = tournament.timer.status === "paused";
  const isRevealed = tournament.phase === "revealed";
  const stageInfo = STAGE_CONFIG[tournament.currentStage] || { label: tournament.currentStage, count: tournament.activeDuels.length };

  // Monospace MM:SS Formatter
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Timer status message
  let timerStatusText = "STOPPED";
  if (isTimerRunning) {
    timerStatusText = `RUNNING · ${tournament.timer.duration || 30} SEC`;
  } else if (isTimerPaused) {
    timerStatusText = `PAUSED · ${tournament.timer.remainingSeconds}S REMAINING`;
  } else if (tournament.phase === "locked" || tournament.timer.status === "expired") {
    timerStatusText = "TIME EXPIRED · ANSWERS LOCKED";
  } else if (isRevealed) {
    timerStatusText = "OUTCOMES REVEALED";
  } else if (tournament.phase === "question_incoming") {
    timerStatusText = "QUESTION PUSHED · WAITING TO START";
  }

  if (!isAdminUnlocked) {
    return (
      <div
        style={{
          minHeight: "65vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "2rem",
          fontFamily: "var(--font-mono, 'SF Mono', Consolas, monospace)",
        }}
      >
        <div
          style={{
            maxWidth: "440px",
            width: "100%",
            background: "#0c0d10",
            border: "1px solid #27272a",
            borderRadius: "8px",
            padding: "2rem",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <Shield size={20} color="#f43f5e" />
            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#ffffff", letterSpacing: "1.5px" }}>
              ORGANIZER ACCESS ONLY
            </span>
          </div>

          <p style={{ fontSize: "0.78rem", color: "#a1a1aa", lineHeight: "1.5", marginBottom: "1.25rem" }}>
            This console controls live problem statements, the master countdown timer, and tournament credit scoring. Enter the organizer passcode to proceed.
          </p>

          <form onSubmit={handleUnlockAdmin} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "#71717a", fontWeight: 700, marginBottom: "0.35rem", letterSpacing: "1px" }}>
                ORGANIZER PASSCODE
              </label>
              <input
                type="password"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="Enter passcode..."
                autoFocus
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "4px",
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {passcodeError && (
              <div style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 700 }}>
                {passcodeError}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.7rem",
                borderRadius: "4px",
                background: "#f43f5e",
                border: "none",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: "0.82rem",
                letterSpacing: "0.5px",
                cursor: "pointer",
                marginTop: "0.25rem",
              }}
            >
              UNLOCK CONTROL CONSOLE
            </button>

            <div style={{ fontSize: "0.7rem", color: "#52525b", textAlign: "center", marginTop: "0.4rem" }}>
              Default Passcode: <code style={{ color: "#a1a1aa" }}>cybernauts2026</code>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1320px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        color: "#f4f4f5",
        fontFamily: "var(--font-mono, 'SF Mono', Consolas, Menlo, Monaco, monospace)",
      }}
    >
      {/* 1. MINIMAL EVENT CONSOLE HEADER */}
      <div
        style={{
          borderBottom: "1px solid #27272a",
          paddingBottom: "0.85rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "1.5px", color: "#ffffff", textTransform: "uppercase" }}>
              CYBERNAUTS · ROUND 2
            </span>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                padding: "0.15rem 0.45rem",
                borderRadius: "3px",
                border: "1px solid #3f3f46",
                color: "#a1a1aa",
                letterSpacing: "1px",
              }}
            >
              ADMIN
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.78rem", color: "#a1a1aa", marginTop: "0.25rem" }}>
            <span>
              {stageInfo.label} · {stageInfo.count} matches
            </span>
            <span style={{ color: "#3f3f46" }}>|</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#22c55e", fontWeight: 700 }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
              LIVE
            </span>
            <span style={{ color: "#3f3f46" }}>|</span>
            <span style={{ color: "#71717a" }}>
              PHASE: <strong style={{ color: "#e4e4e7" }}>{tournament.phase.toUpperCase()}</strong>
            </span>
          </div>
        </div>

        {/* Console Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <button
            onClick={() => setNavTab("control")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "1px solid",
              borderColor: navTab === "control" ? "#3f3f46" : "transparent",
              background: navTab === "control" ? "#18181b" : "transparent",
              color: navTab === "control" ? "#ffffff" : "#a1a1aa",
              cursor: "pointer",
            }}
          >
            Control
          </button>

          <button
            onClick={() => setNavTab("questions")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "1px solid",
              borderColor: navTab === "questions" ? "#3f3f46" : "transparent",
              background: navTab === "questions" ? "#18181b" : "transparent",
              color: navTab === "questions" ? "#ffffff" : "#a1a1aa",
              cursor: "pointer",
            }}
          >
            Questions ({questions.length})
          </button>

          <button
            onClick={() => setNavTab("teams")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "1px solid",
              borderColor: navTab === "teams" ? "#3f3f46" : "transparent",
              background: navTab === "teams" ? "#18181b" : "transparent",
              color: navTab === "teams" ? "#ffffff" : "#a1a1aa",
              cursor: "pointer",
            }}
          >
            Teams ({tournament.teams.length})
          </button>

          <a
            href="/bracket"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "1px solid transparent",
              color: "#a1a1aa",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span>Arena</span>
            <ExternalLink size={12} />
          </a>

          <button
            disabled={isSubmittingAction}
            onClick={handleResetBalances}
            title="Reset all team and duel balances to 10,000 CR"
            style={{
              padding: "0.35rem 0.65rem",
              borderRadius: "4px",
              fontSize: "0.7rem",
              fontWeight: 700,
              border: "1px solid #3f3f46",
              background: "#18181b",
              color: "#eab308",
              cursor: "pointer",
              marginLeft: "0.35rem",
            }}
          >
            Reset 10k Balances
          </button>

          <button
            disabled={isSubmittingAction}
            onClick={handleMoveToRound2}
            title="Move to Round 2 (Quarterfinals) with carried-over team points"
            style={{
              padding: "0.35rem 0.65rem",
              borderRadius: "4px",
              fontSize: "0.7rem",
              fontWeight: 800,
              border: "1px solid #38bdf8",
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38bdf8",
              cursor: "pointer",
              marginLeft: "0.35rem",
            }}
          >
            Sync Round 2 (QF)
          </button>

          <button
            disabled={isSubmittingAction}
            onClick={handleMoveToSemifinals}
            title="Move to Semifinals (4 Teams Left) with carried-over team points"
            style={{
              padding: "0.35rem 0.65rem",
              borderRadius: "4px",
              fontSize: "0.7rem",
              fontWeight: 800,
              border: "1px solid #a855f7",
              background: "rgba(168, 85, 247, 0.15)",
              color: "#c084fc",
              cursor: "pointer",
              marginLeft: "0.35rem",
            }}
          >
            Sync Semifinals (4 Teams)
          </button>

          <button
            onClick={handleLockAdmin}
            title="Lock this admin control panel"
            style={{
              marginLeft: "0.35rem",
              padding: "0.35rem 0.65rem",
              borderRadius: "4px",
              fontSize: "0.7rem",
              fontWeight: 700,
              border: "1px solid #3f3f46",
              background: "#18181b",
              color: "#a1a1aa",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <Lock size={12} />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* VIEW: CONTROL (DEFAULT LIVE TOURNAMENT CONSOLE) */}
      {navTab === "control" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* DESK PRESENCE BAR */}
          <div style={{ background: "#0c0d10", border: "1px solid #27272a", borderRadius: "6px", padding: "0.75rem 1.15rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.7rem", color: "#71717a", letterSpacing: "0.1em" }}>
                DESK PRESENCE
              </span>
              <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "#71717a" }}>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#22c55e", marginRight: 4 }} />LIVE</span>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#eab308", marginRight: 4 }} />STALE</span>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#3f3f46", marginRight: 4 }} />OFFLINE</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {(tournament.presence || []).map((p) => {
                const dotColor = p.status === "live" ? "#22c55e" : p.status === "stale" ? "#eab308" : "#3f3f46";
                const label = p.status === "live" ? `${p.id} — LIVE` : p.status === "stale" ? `${p.id} — stale (${p.lastSeenAgo}s ago)` : `${p.id} — offline`;
                return (
                  <div key={p.id} title={label} style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "#18181b", borderRadius: "4px", padding: "3px 7px", border: `1px solid ${p.status === "live" ? "#166534" : p.status === "stale" ? "#713f12" : "#27272a"}` }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, display: "inline-block", boxShadow: p.status === "live" ? `0 0 6px ${dotColor}` : "none" }} />
                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.62rem", color: p.status === "live" ? "#86efac" : p.status === "stale" ? "#fde68a" : "#52525b" }}>{p.id}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. QUESTION BAR & DISPATCH */}
          {/* 2. DUEL SET & 3-QUESTION MATCH CONTROLLER */}
          {(() => {
            const currentDuelSet = duelSets.find((d) => d.duelNumber === selectedDuelNumber) || duelSets[0];
            return (
              <div
                style={{
                  background: "#0c0d10",
                  border: "1px solid #27272a",
                  borderRadius: "6px",
                  padding: "1rem 1.15rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}
              >
                {/* Duel Header & Selector */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "1.2px", color: "#38bdf8", textTransform: "uppercase" }}>
                      DUEL SET DISPATCH
                    </span>
                    <span style={{ fontSize: "0.68rem", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "0.15rem 0.45rem", borderRadius: "3px", fontWeight: 800 }}>
                      3 QUESTIONS PER DUEL
                    </span>
                  </div>

                  {/* Select Duel Set */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "#71717a", fontWeight: 700 }}>SELECT DUEL:</span>
                    <select
                      value={selectedDuelNumber}
                      onChange={(e) => setSelectedDuelNumber(Number(e.target.value))}
                      style={{
                        padding: "0.35rem 0.65rem",
                        borderRadius: "4px",
                        background: "#18181b",
                        border: "1px solid #3f3f46",
                        color: "#f4f4f5",
                        fontSize: "0.78rem",
                        outline: "none",
                        fontWeight: 700,
                      }}
                    >
                      {duelSets.map((ds) => (
                        <option key={ds.duelNumber} value={ds.duelNumber}>
                          Duel {String(ds.duelNumber).padStart(2, "0")}: {ds.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected Duel Summary Card */}
                {currentDuelSet && (
                  <div
                    style={{
                      background: "#121215",
                      border: "1px solid #27272a",
                      borderRadius: "6px",
                      padding: "0.75rem 0.9rem",
                    }}
                  >
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.3rem" }}>
                      Duel {String(currentDuelSet.duelNumber).padStart(2, "0")} · {currentDuelSet.title}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#d4d4d8", lineHeight: "1.45", marginBottom: "0.35rem" }}>
                      <strong style={{ color: "#71717a" }}>Case: </strong>
                      {currentDuelSet.caseStudy}
                    </div>
                    {currentDuelSet.mission && (
                      <div style={{ fontSize: "0.73rem", color: "#93c5fd", background: "rgba(56, 189, 248, 0.06)", padding: "0.3rem 0.5rem", borderRadius: "4px", borderLeft: "2px solid #38bdf8" }}>
                        <strong style={{ color: "#38bdf8" }}>Mission: </strong>
                        {currentDuelSet.mission}
                      </div>
                    )}

                    {/* 3 Questions Quick-Launch Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.6rem", marginTop: "0.75rem" }}>
                      {currentDuelSet.questions.map((q) => {
                        const isActive = tournament?.activeQuestion?.id === q.id;
                        return (
                          <div
                            key={q.id}
                            style={{
                              background: isActive ? "rgba(56, 189, 248, 0.08)" : "#18181b",
                              border: `1px solid ${isActive ? "#38bdf8" : "#27272a"}`,
                              borderRadius: "4px",
                              padding: "0.6rem 0.75rem",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              gap: "0.45rem",
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                <span style={{ fontSize: "0.7rem", fontWeight: 900, color: isActive ? "#38bdf8" : "#a1a1aa" }}>
                                  QUESTION {q.questionNumber} OF 3
                                </span>
                                {isActive && (
                                  <span style={{ fontSize: "0.62rem", fontWeight: 900, background: "#38bdf8", color: "#09090b", padding: "0.1rem 0.35rem", borderRadius: "2px" }}>
                                    LIVE NOW
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "0.73rem", color: "#e4e4e7", lineHeight: "1.35" }}>
                                {q.question}
                              </div>
                            </div>

                            <button
                              disabled={isSubmittingAction}
                              onClick={() => handlePushDuelQuestion(q.id, 30)}
                              style={{
                                width: "100%",
                                padding: "0.4rem 0.6rem",
                                borderRadius: "3px",
                                background: isActive ? "#38bdf8" : "#27272a",
                                border: "none",
                                color: isActive ? "#09090b" : "#ffffff",
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.3rem",
                              }}
                            >
                              <Zap size={11} />
                              <span>Launch Q{q.questionNumber} (30s Clock)</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Actions & Master Timer Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", paddingTop: "0.4rem", borderTop: "1px solid #1f1f23" }}>
                  <select
                    value={selectedQuestionId}
                    onChange={(e) => setSelectedQuestionId(e.target.value)}
                    style={{
                      flex: "1 1 280px",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "4px",
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      color: "#f4f4f5",
                      fontSize: "0.76rem",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  >
                    <option value="random">🎲 Random Question ({questions.length} in Bank)</option>
                    {questions.map((q) => (
                      <option key={q.id} value={q.id}>
                        Q{String(q.id).padStart(2, "0")} · {q.title}
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={isSubmittingAction}
                    onClick={handlePushQuestion}
                    style={{
                      padding: "0.45rem 0.8rem",
                      borderRadius: "4px",
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      color: "#f4f4f5",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <Send size={12} />
                    <span>Push Selected</span>
                  </button>

                  <button
                    disabled={isSubmittingAction}
                    onClick={() => handleStartTimer(30)}
                    style={{
                      padding: "0.45rem 0.8rem",
                      borderRadius: "4px",
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      color: "#38bdf8",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Start 30s
                  </button>

                  <button
                    disabled={isSubmittingAction}
                    onClick={() => handleStartTimer(45)}
                    style={{
                      padding: "0.45rem 0.8rem",
                      borderRadius: "4px",
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      color: "#38bdf8",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Start 45s
                  </button>

                  <button
                    disabled={isSubmittingAction}
                    onClick={() => handlePushAndStart(30)}
                    style={{
                      padding: "0.45rem 0.85rem",
                      borderRadius: "4px",
                      background: "#f43f5e",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <Zap size={12} />
                    <span>Push & Start 30s</span>
                  </button>
                </div>

                {/* Current Active Problem Snippet */}
                {tournament.activeQuestion && (
                  <div
                    style={{
                      marginTop: "0.6rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "4px",
                      background: "#121215",
                      border: "1px solid #1f1f23",
                      fontSize: "0.75rem",
                      color: "#a1a1aa",
                      lineHeight: "1.4",
                    }}
                  >
                    <strong style={{ color: "#f4f4f5" }}>{tournament.activeQuestion.title}:</strong>{" "}
                    {tournament.activeQuestion.question}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3. CENTERPIECE MASTER TIMER */}
          <div
            style={{
              padding: "1.5rem 1rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* 00:24 Digits */}
            <div
              style={{
                fontSize: "4.5rem",
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: "2px",
                color: clientRemaining <= 7 && isTimerRunning ? "#ef4444" : "#f4f4f5",
                fontVariantNumeric: "tabular-nums",
                marginBottom: "0.35rem",
              }}
            >
              {formatTimer(clientRemaining)}
            </div>

            {/* Separator Line */}
            <div style={{ width: "160px", height: "1px", background: "#3f3f46", margin: "0.35rem auto 0.5rem auto" }} />

            {/* Subtitle Status */}
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "1.5px",
                color: isTimerRunning ? "#38bdf8" : isRevealed ? "#22c55e" : "#71717a",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              {timerStatusText}
            </div>

            {/* Timer Actions: Pause / Resume, +10, -10, Stop, and Reveal/Advance */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              {isTimerRunning ? (
                <button
                  onClick={() => handleTimerAction("pause")}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: "4px",
                    background: "#27272a",
                    border: "1px solid #3f3f46",
                    color: "#f4f4f5",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Pause size={13} />
                  <span>PAUSE</span>
                </button>
              ) : isTimerPaused ? (
                <button
                  onClick={() => handleTimerAction("resume")}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: "4px",
                    background: "#166534",
                    border: "1px solid #22c55e",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Play size={13} />
                  <span>RESUME</span>
                </button>
              ) : null}

              <button
                onClick={() => handleTimerAction("add_time", 10)}
                style={{
                  padding: "0.45rem 0.75rem",
                  borderRadius: "4px",
                  background: "#18181b",
                  border: "1px solid #27272a",
                  color: "#d4d4d8",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                +10
              </button>

              <button
                onClick={() => handleTimerAction("sub_time", 10)}
                style={{
                  padding: "0.45rem 0.75rem",
                  borderRadius: "4px",
                  background: "#18181b",
                  border: "1px solid #27272a",
                  color: "#d4d4d8",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                -10
              </button>

              <button
                onClick={() => handleTimerAction("stop")}
                style={{
                  padding: "0.45rem 0.75rem",
                  borderRadius: "4px",
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  color: "#fca5a5",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                STOP
              </button>

              <div style={{ width: "1px", height: "24px", background: "#27272a", margin: "0 0.35rem" }} />

              {/* REVEAL OUTCOMES BUTTON */}
              <button
                disabled={isSubmittingAction}
                onClick={handleRevealOutcomes}
                style={{
                  padding: "0.5rem 1.1rem",
                  borderRadius: "4px",
                  background: isRevealed ? "#18181b" : "#38bdf8",
                  border: isRevealed ? "1px solid #22c55e" : "none",
                  color: isRevealed ? "#22c55e" : "#09090b",
                  fontSize: "0.78rem",
                  fontWeight: 900,
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Eye size={14} />
                <span>{isRevealed ? "OUTCOMES REVEALED ✓" : "REVEAL OUTCOMES"}</span>
              </button>

              {/* ADVANCE STAGE BUTTON */}
              {isRevealed && (
                <button
                  disabled={isSubmittingAction}
                  onClick={handleAdvanceStage}
                  style={{
                    padding: "0.5rem 1.1rem",
                    borderRadius: "4px",
                    background: "#22c55e",
                    border: "none",
                    color: "#09090b",
                    fontSize: "0.78rem",
                    fontWeight: 900,
                    letterSpacing: "0.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <FastForward size={14} />
                  <span>ADVANCE STAGE →</span>
                </button>
              )}
            </div>
          </div>

          {/* 4. LIVE MATCHES - DENSE GRID */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #27272a",
                paddingBottom: "0.4rem",
                marginBottom: "0.85rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "1.2px", color: "#71717a", textTransform: "uppercase" }}>
                LIVE MATCHES
              </span>
              <span style={{ fontSize: "0.72rem", color: "#a1a1aa" }}>
                {tournament.activeDuels.length} ACTIVE
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {tournament.activeDuels.map((duel) => {
                const subA = duel.currentRoundSubmissions?.teamA;
                const subB = duel.currentRoundSubmissions?.teamB;

                // Credit visibility: ONLY apply deltas if outcomes are revealed!
                const displayCreditsA = isRevealed ? duel.creditsA : duel.creditsA - (duel.roundDeltaA || 0);
                const displayCreditsB = isRevealed ? duel.creditsB : duel.creditsB - (duel.roundDeltaB || 0);

                const bothAnswered = !!(subA && subB);

                return (
                  <div
                    key={duel.id}
                    style={{
                      background: "#0c0d10",
                      border: `1px solid ${duel.winner ? "#166534" : bothAnswered ? "#27272a" : "#1f1f23"}`,
                      borderRadius: "6px",
                      padding: "0.85rem 1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                    }}
                  >
                    {/* Match Card Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem" }}>
                      <span style={{ fontWeight: 800, color: "#a1a1aa", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <span>{duel.id} · MATCH {String(duel.duelNumber).padStart(2, "0")}</span>
                        <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "3px", background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", fontWeight: 900 }}>
                          GAME {duel.questionsAnswered || 0}/3
                        </span>
                      </span>

                      {duel.winner ? (
                        <span style={{ color: "#22c55e", fontWeight: 800 }}>
                          👑 {duel.winner.name} WINS MATCH (3/3)
                        </span>
                      ) : isRevealed ? (
                        <span style={{ color: "#38bdf8", fontWeight: 700 }}>Q{duel.questionsAnswered || 1} EVALUATED</span>
                      ) : bothAnswered ? (
                        <span style={{ color: "#eab308", fontWeight: 700 }}>LOCKED IN</span>
                      ) : (
                        <span style={{ color: "#71717a" }}>Q{Math.min(3, (duel.questionsAnswered || 0) + 1)} LIVE</span>
                      )}
                    </div>

                    {/* Team A vs Team B Columns */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      {/* Left: Team A */}
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f4f4f5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {duel.teamA?.name || "TBD"}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#71717a" }}>
                          {duel.teamA?.id || "T??"}
                        </div>

                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#e4e4e7", margin: "0.35rem 0 0.15rem 0" }}>
                          {(displayCreditsA ?? 10000).toLocaleString()} CR
                        </div>

                        {/* Answer Status or Delta */}
                        {isRevealed ? (
                          <div>
                            <div style={{ fontSize: "0.82rem", fontWeight: 800 }}>
                              {subA ? (
                                <>
                                  <span style={{ color: "#38bdf8" }}>{OPTION_LETTERS[subA.optionIndex]}</span> ·{" "}
                                  <span style={{ color: subA.creditChange > 0 ? "#22c55e" : subA.creditChange === 0 ? "#a1a1aa" : "#ef4444" }}>
                                    {subA.creditChange > 0 ? `+${subA.creditChange.toLocaleString()}` : subA.creditChange.toLocaleString()}
                                  </span>
                                </>
                              ) : (
                                <span style={{ color: "#ef4444" }}>No Answer (-4,000)</span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "#71717a" }}>
                              {subA ? `${subA.timeTaken}s` : "expired"}
                            </div>
                          </div>
                        ) : subA ? (
                          <div>
                            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#38bdf8" }}>
                              {OPTION_LETTERS[subA.optionIndex]} · {subA.timeTaken}s
                            </div>
                            <div style={{ fontSize: "0.68rem", color: "#71717a" }}>locked in</div>
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.78rem", color: "#71717a", fontStyle: "italic", paddingTop: "0.15rem" }}>
                            WAITING
                          </div>
                        )}
                      </div>

                      {/* Right: Team B */}
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f4f4f5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {duel.teamB?.name || "TBD"}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#71717a" }}>
                          {duel.teamB?.id || "T??"}
                        </div>

                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#e4e4e7", margin: "0.35rem 0 0.15rem 0" }}>
                          {(displayCreditsB ?? 10000).toLocaleString()} CR
                        </div>

                        {/* Answer Status or Delta */}
                        {isRevealed ? (
                          <div>
                            <div style={{ fontSize: "0.82rem", fontWeight: 800 }}>
                              {subB ? (
                                <>
                                  <span style={{ color: "#38bdf8" }}>{OPTION_LETTERS[subB.optionIndex]}</span> ·{" "}
                                  <span style={{ color: subB.creditChange > 0 ? "#22c55e" : subB.creditChange === 0 ? "#a1a1aa" : "#ef4444" }}>
                                    {subB.creditChange > 0 ? `+${subB.creditChange.toLocaleString()}` : subB.creditChange.toLocaleString()}
                                  </span>
                                </>
                              ) : (
                                <span style={{ color: "#ef4444" }}>No Answer (-4,000)</span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "#71717a" }}>
                              {subB ? `${subB.timeTaken}s` : "expired"}
                            </div>
                          </div>
                        ) : subB ? (
                          <div>
                            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#38bdf8" }}>
                              {OPTION_LETTERS[subB.optionIndex]} · {subB.timeTaken}s
                            </div>
                            <div style={{ fontSize: "0.68rem", color: "#71717a" }}>locked in</div>
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.78rem", color: "#71717a", fontStyle: "italic", paddingTop: "0.15rem" }}>
                            WAITING
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Discreet Host Override Action Row */}
                    <div style={{ borderTop: "1px solid #18181b", paddingTop: "0.45rem", display: "flex", gap: "0.5rem" }}>
                      <button
                        disabled={!duel.teamA}
                        onClick={() => handleSetDuelWinner(duel.id, duel.teamA!.id, duel.teamA!.name)}
                        style={{
                          flex: 1,
                          padding: "0.25rem",
                          borderRadius: "3px",
                          background: "transparent",
                          border: "1px solid #27272a",
                          color: "#71717a",
                          fontSize: "0.68rem",
                          cursor: "pointer",
                        }}
                      >
                        Award {duel.teamA?.id || "A"}
                      </button>
                      <button
                        disabled={!duel.teamB}
                        onClick={() => handleSetDuelWinner(duel.id, duel.teamB!.id, duel.teamB!.name)}
                        style={{
                          flex: 1,
                          padding: "0.25rem",
                          borderRadius: "3px",
                          background: "transparent",
                          border: "1px solid #27272a",
                          color: "#71717a",
                          fontSize: "0.68rem",
                          cursor: "pointer",
                        }}
                      >
                        Award {duel.teamB?.id || "B"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: QUESTIONS BANK */}
      {navTab === "questions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #27272a", paddingBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#71717a", textTransform: "uppercase", letterSpacing: "1px" }}>
              CHAMPIONSHIP QUESTION BANK ({questions.length} PROBLEMS)
            </span>
            <span style={{ fontSize: "0.72rem", color: "#a1a1aa" }}>
              Authoritative host answer key with outcome weights
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {questions.map((q) => (
              <div
                key={q.id}
                style={{
                  background: "#0c0d10",
                  border: "1px solid #27272a",
                  borderRadius: "6px",
                  padding: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#38bdf8" }}>Q{String(q.id).padStart(2, "0")}</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#f4f4f5" }}>{q.title}</span>
                    <span style={{ fontSize: "0.7rem", color: "#71717a", border: "1px solid #27272a", padding: "0.1rem 0.4rem", borderRadius: "3px" }}>
                      {q.category}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedQuestionId(String(q.id));
                      setNavTab("control");
                      triggerToast(`Loaded Q${q.id} into Question Dispatcher`);
                    }}
                    style={{
                      padding: "0.3rem 0.65rem",
                      borderRadius: "4px",
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      color: "#f4f4f5",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Select in Console
                  </button>
                </div>

                <p style={{ fontSize: "0.8rem", color: "#d4d4d8", margin: "0.4rem 0" }}>{q.question}</p>

                {q.code && (
                  <pre
                    style={{
                      background: "#050507",
                      border: "1px solid #1f1f23",
                      borderRadius: "4px",
                      padding: "0.6rem",
                      fontSize: "0.75rem",
                      color: "#a1a1aa",
                      overflowX: "auto",
                      marginBottom: "0.6rem",
                    }}
                  >
                    {q.code}
                  </pre>
                )}

                {/* Options Table */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.4rem" }}>
                  {q.options.map((opt, idx) => {
                    const outcome = opt.outcome || "neutral";
                    let outcomeLabel = "Neutral (0 CR)";
                    let badgeColor = "#71717a";

                    if (outcome === "best") {
                      outcomeLabel = "Best (+3,000 CR)";
                      badgeColor = "#22c55e";
                    } else if (outcome === "less_good") {
                      outcomeLabel = "Less-Good (+1,500 CR)";
                      badgeColor = "#38bdf8";
                    } else if (outcome === "less_bad") {
                      outcomeLabel = "Less-Bad (-2,000 CR)";
                      badgeColor = "#f59e0b";
                    } else if (outcome === "worst") {
                      outcomeLabel = "Worst (-4,000 CR)";
                      badgeColor = "#ef4444";
                    }

                    return (
                      <div
                        key={idx}
                        style={{
                          background: "#121215",
                          border: "1px solid #1f1f23",
                          borderRadius: "4px",
                          padding: "0.5rem",
                          fontSize: "0.72rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                          <span style={{ fontWeight: 800, color: "#ffffff" }}>Option {OPTION_LETTERS[idx]}</span>
                          <span style={{ color: badgeColor, fontWeight: 700, fontSize: "0.68rem" }}>{outcomeLabel}</span>
                        </div>
                        <div style={{ color: "#a1a1aa" }}>{opt.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: TEAMS ROSTER & PIN CREDENTIALS */}
      {navTab === "teams" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #27272a", paddingBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#71717a", textTransform: "uppercase", letterSpacing: "1px" }}>
                TEAM DESK CREDENTIALS & PIN SLIPS (16 TEAMS)
              </div>
              <div style={{ fontSize: "0.72rem", color: "#a1a1aa", marginTop: "0.15rem" }}>
                Rename teams on the fly — names update instantly across duel cards, bracket, and participant screens.
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {/* Print Host Sheet */}
              <button
                onClick={handlePrintHostSheet}
                title="Open a printable host credential sheet with all team PINs"
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "4px",
                  background: "#22c55e",
                  border: "none",
                  color: "#052e16",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <KeyRound size={13} />
                <span>Print Host Sheet</span>
              </button>

              <button
                onClick={handleOpenBatchRename}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "4px",
                  background: "#38bdf8",
                  border: "none",
                  color: "#09090b",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <Edit3 size={13} />
                <span>Rename Teams (Bulk / Paste)</span>
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "0.6rem" }}>
            {tournament.teams.map((t) => {
              const isEditing = editingTeamId === t.id;

              return (
                <div
                  key={t.id}
                  style={{
                    background: "#0c0d10",
                    border: `1px solid ${isEditing ? "#38bdf8" : "#27272a"}`,
                    borderRadius: "6px",
                    padding: "0.75rem 0.85rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#38bdf8" }}>{t.id} ·</span>
                        <input
                          value={editingTeamName}
                          onChange={(e) => setEditingTeamName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveSingleTeam(t.id, editingTeamName);
                            if (e.key === "Escape") setEditingTeamId(null);
                          }}
                          autoFocus
                          style={{
                            padding: "0.25rem 0.4rem",
                            borderRadius: "3px",
                            background: "#18181b",
                            border: "1px solid #38bdf8",
                            color: "#ffffff",
                            fontSize: "0.78rem",
                            outline: "none",
                            fontFamily: "inherit",
                            width: "120px",
                          }}
                        />
                        <button
                          onClick={() => handleSaveSingleTeam(t.id, editingTeamName)}
                          title="Save Name"
                          style={{ padding: "0.25rem 0.4rem", borderRadius: "3px", background: "#22c55e", border: "none", color: "#09090b", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingTeamId(null)}
                          title="Cancel"
                          style={{ padding: "0.25rem 0.4rem", borderRadius: "3px", background: "#27272a", border: "none", color: "#a1a1aa", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.id} · {t.name}
                        </span>
                        <button
                          onClick={() => {
                            setEditingTeamId(t.id);
                            setEditingTeamName(t.name);
                          }}
                          title="Rename Team"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#71717a",
                            cursor: "pointer",
                            padding: "0.15rem",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                    )}

                    <div style={{ fontSize: "0.7rem", color: "#71717a", marginTop: "0.2rem" }}>
                      Balance: <strong style={{ color: "#e4e4e7" }}>{t.credits.toLocaleString()} CR</strong>
                    </div>

                    <a
                      href={`/team?id=${t.id}&pin=${t.pin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "0.68rem", color: "#38bdf8", textDecoration: "none", marginTop: "0.25rem", display: "inline-block" }}
                    >
                      Open Station →
                    </a>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.65rem", color: "#71717a", fontWeight: 700, letterSpacing: "1px" }}>
                      SECRET PIN
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#eab308", letterSpacing: "2px" }}>
                      {t.pin}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BULK RENAME MODAL */}
          {showBatchRenameModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                background: "rgba(0, 0, 0, 0.85)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  maxWidth: "680px",
                  width: "100%",
                  background: "#0c0d10",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid #27272a", paddingBottom: "0.6rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Edit3 size={18} color="#38bdf8" />
                    <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#ffffff", letterSpacing: "1px" }}>
                      RENAME 16 TOURNAMENT TEAMS
                    </span>
                  </div>
                  <button
                    onClick={() => setShowBatchRenameModal(false)}
                    style={{ background: "transparent", border: "none", color: "#a1a1aa", cursor: "pointer" }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Quick Paste 16 lines */}
                <div style={{ background: "#121215", border: "1px solid #1f1f23", borderRadius: "6px", padding: "0.85rem", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.72rem", color: "#a1a1aa", fontWeight: 700, marginBottom: "0.4rem" }}>
                    QUICK PASTE FROM EXCEL / WHATSAPP (16 LINES):
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <textarea
                      value={bulkPasteText}
                      onChange={(e) => setBulkPasteText(e.target.value)}
                      placeholder="Paste 16 team names here (one name per line)..."
                      rows={3}
                      style={{
                        flex: 1,
                        background: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "4px",
                        padding: "0.5rem",
                        color: "#ffffff",
                        fontSize: "0.75rem",
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyBulkPaste}
                      style={{
                        padding: "0 0.85rem",
                        borderRadius: "4px",
                        background: "#27272a",
                        border: "1px solid #3f3f46",
                        color: "#f4f4f5",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Apply to Slots
                    </button>
                  </div>
                </div>

                {/* 16 Slots Grid (2 columns of 8) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  {batchTeamsList.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "#18181b",
                        border: "1px solid #27272a",
                        padding: "0.4rem 0.6rem",
                        borderRadius: "4px",
                      }}
                    >
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#38bdf8", width: "32px" }}>{item.id}</span>
                      <input
                        value={item.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBatchTeamsList((prev) =>
                            prev.map((t) => (t.id === item.id ? { ...t, name: val } : t))
                          );
                        }}
                        placeholder={`Team ${idx + 1} Name`}
                        style={{
                          flex: 1,
                          background: "transparent",
                          border: "none",
                          borderBottom: "1px solid #3f3f46",
                          color: "#ffffff",
                          fontSize: "0.78rem",
                          padding: "0.2rem",
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Modal Footer Buttons */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.6rem", borderTop: "1px solid #27272a", paddingTop: "0.85rem" }}>
                  <button
                    onClick={() => setShowBatchRenameModal(false)}
                    style={{ padding: "0.5rem 0.9rem", borderRadius: "4px", background: "transparent", border: "1px solid #3f3f46", color: "#a1a1aa", fontSize: "0.78rem", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSubmittingAction}
                    onClick={handleSaveBatchRename}
                    style={{ padding: "0.5rem 1.25rem", borderRadius: "4px", background: "#22c55e", border: "none", color: "#09090b", fontSize: "0.78rem", fontWeight: 900, cursor: "pointer" }}
                  >
                    Save All 16 Team Names
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. SEPARATED LOW-HIERARCHY UTILITY FOOTER */}
      <div
        style={{
          marginTop: "1.5rem",
          paddingTop: "0.75rem",
          borderTop: "1px solid #18181b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          fontSize: "0.72rem",
          color: "#52525b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span>Knockout Bracket: 16 Teams Single-Elimination</span>
          <span>•</span>
          <span>Authoritative Server Epoch Clock</span>
        </div>

        {/* Destructive Actions Kept Strictly In Utility Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => handleResetTournament(false)}
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "3px",
              background: "transparent",
              border: "1px solid transparent",
              color: "#71717a",
              fontSize: "0.68rem",
              cursor: "pointer",
            }}
          >
            Reset 10k Credits
          </button>

          <button
            onClick={() => handleResetTournament(true)}
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "3px",
              background: "transparent",
              border: "1px solid transparent",
              color: "#71717a",
              fontSize: "0.68rem",
              cursor: "pointer",
            }}
          >
            Re-seed Bracket
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            background: toast.type === "info" ? "#0284c7" : "#16a34a",
            color: "#ffffff",
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            zIndex: 9999,
            fontWeight: 700,
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Check size={18} />
          {toast.message}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              maxWidth: "460px",
              width: "100%",
              background: "#121318",
              border: "1px solid #3f3f46",
              borderRadius: "12px",
              padding: "1.75rem",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.75rem" }}>
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#a1a1aa", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              {confirmModal.message}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  background: "#27272a",
                  color: "#d4d4d8",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const cb = confirmModal.onConfirm;
                  setConfirmModal(null);
                  cb();
                }}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "6px",
                  background: "#e11d48",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              maxWidth: "460px",
              width: "100%",
              background: "#121318",
              border: alertModal.type === "warning" ? "1px solid #f59e0b" : "1px solid #38bdf8",
              borderRadius: "12px",
              padding: "1.75rem",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.75rem" }}>
              {alertModal.title}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#a1a1aa", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              {alertModal.message}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setAlertModal(null)}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "6px",
                  background: "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
