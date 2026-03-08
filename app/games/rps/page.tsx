"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type Choice = "rock" | "paper" | "scissors" | null;

const TURN_TIME = 30;

const opponentNames = [
  "Alex",
  "Jordan",
  "Taylor",
  "Chris",
  "Sam",
  "Jamie",
  "Morgan",
];

const options: Choice[] = ["rock", "paper", "scissors"];

export default function RPS() {
  const [playerChoice, setPlayerChoice] = useState<Choice>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice>(null);

  const [thinking, setThinking] = useState(false);
  const [timer, setTimer] = useState(TURN_TIME);

  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const [history, setHistory] = useState<Choice[]>([]);

  const playerName = "You";

  const [opponentName] = useState(
    opponentNames[Math.floor(Math.random() * opponentNames.length)],
  );

  /* -------- COUNTER MOVE -------- */

  function counterMove(move: Choice): Choice {
    if (move === "rock") return "paper";
    if (move === "paper") return "scissors";
    return "rock";
  }

  /* -------- AI DECISION -------- */

  function aiMove(): Choice {
    if (history.length < 2) {
      return options[Math.floor(Math.random() * 3)];
    }

    const last = history[history.length - 1];

    return counterMove(last);
  }

  /* -------- RESULT -------- */

  function getResult(player: Choice, opponent: Choice) {
    if (player === opponent) return "draw";

    if (
      (player === "rock" && opponent === "scissors") ||
      (player === "paper" && opponent === "rock") ||
      (player === "scissors" && opponent === "paper")
    ) {
      return "player";
    }

    return "opponent";
  }

  /* -------- PLAYER MOVE -------- */

  function play(choice: Choice) {
    if (thinking) return;

    setPlayerChoice(choice);
    setThinking(true);
    setTimer(TURN_TIME);

    setHistory([...history, choice]);

    const delay = 500 + Math.random() * 3000;

    setTimeout(() => {
      const aiChoice = aiMove();

      setOpponentChoice(aiChoice);

      const result = getResult(choice, aiChoice);

      if (result === "player") {
        setPlayerScore((s) => s + 1);
      } else if (result === "opponent") {
        setOpponentScore((s) => s + 1);
      }

      setThinking(false);
    }, delay);
  }

  /* -------- TIMER -------- */

  useEffect(() => {
    if (thinking) return;

    if (timer === 0) {
      const auto = options[Math.floor(Math.random() * 3)];
      play(auto);
      return;
    }

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, thinking]);

  /* -------- RESTART -------- */

  function restart() {
    setPlayerChoice(null);
    setOpponentChoice(null);
    setPlayerScore(0);
    setOpponentScore(0);
    setThinking(false);
    setTimer(TURN_TIME);
    setHistory([]);
  }

  /* -------- RESULT TEXT -------- */

  function resultText() {
    if (!playerChoice || !opponentChoice) return "";

    const r = getResult(playerChoice, opponentChoice);

    if (r === "draw") return "Draw";

    if (r === "player") return `${playerName} wins`;

    return `${opponentName} wins`;
  }

  /* -------- UI -------- */

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-3xl font-bold mb-6">Rock Paper Scissors</h1>

      {/* Players */}

      <div className="flex gap-10 mb-4 text-sm">
        <div>{playerName}</div>
        <div>{opponentName}</div>
      </div>

      {/* Score */}

      <div className="mb-4 text-sm">
        {playerScore} - {opponentScore}
      </div>

      {/* Timer */}

      <div className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Time left: {timer}s
      </div>

      {/* Choices */}

      <div className="flex gap-6 mb-8">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => play(o)}
            className="px-6 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            {o}
          </button>
        ))}
      </div>

      {/* Reveal */}

      {(playerChoice || opponentChoice) && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-6 text-lg"
        >
          {playerName}: {playerChoice}
          <br />
          {opponentName}: {opponentChoice}
        </motion.div>
      )}

      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        {thinking ? `${opponentName} thinking...` : resultText()}
      </p>

      <button
        onClick={restart}
        className="px-6 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
      >
        Restart
      </button>
    </main>
  );
}
