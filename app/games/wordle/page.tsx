"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { words } from "@/data/words";

const MAX_GUESSES = 6;
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

export default function Wordle() {
  const [target, setTarget] = useState("");
  const [wordLength, setWordLength] = useState(5);
  const [loading, setLoading] = useState(true);

  const [guesses, setGuesses] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const [winner, setWinner] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [timer, setTimer] = useState(TURN_TIME);

  const playerName = "You";

  const [opponentName] = useState(
    opponentNames[Math.floor(Math.random() * opponentNames.length)],
  );

  /* ---------- RANDOM WORD ---------- */

  function getRandomWord() {
    const word = words[Math.floor(Math.random() * words.length)];

    setTarget(word);
    setWordLength(word.length);
    setLoading(false);
  }

  useEffect(() => {
    getRandomWord();
  }, []);

  /* ---------- LETTER COLOR ---------- */

  function getColor(letter: string, index: number) {
    if (target[index] === letter) return "bg-green-500";

    if (target.includes(letter)) return "bg-yellow-500";

    return "bg-zinc-400";
  }

  /* ---------- SUBMIT GUESS ---------- */

  function submitGuess() {
    if (input.length !== wordLength) return;

    const guess = input.toLowerCase();

    const newGuesses = [...guesses, guess];

    setGuesses(newGuesses);
    setInput("");

    if (guess === target) {
      setWinner(playerName);
      return;
    }

    if (newGuesses.length === MAX_GUESSES) {
      setWinner(opponentName);
      return;
    }

    setThinking(true);

    const delay = 800 + Math.random() * 2000;

    setTimeout(() => {
      if (Math.random() > 0.75) {
        setWinner(opponentName);
      }

      setThinking(false);
    }, delay);
  }

  /* ---------- TIMER ---------- */

  useEffect(() => {
    if (winner || thinking) return;

    if (timer === 0) {
      setWinner(opponentName);
      return;
    }

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, winner, thinking]);

  /* ---------- RESTART ---------- */

  function restart() {
    setGuesses([]);
    setInput("");
    setWinner(null);
    setTimer(TURN_TIME);
    setThinking(false);

    getRandomWord();
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-3xl font-bold mb-4">Word Duel</h1>
      <div className="flex gap-10 mb-4 text-sm">
        <div>{playerName}</div>
        <div>{opponentName}</div>
      </div>
      <div className="mb-4 text-sm text-zinc-500">
        Guess the {wordLength}-letter word • {timer}s left
      </div>
      {/* BOARD */}
      <div className="space-y-2 mb-6">
        {[...Array(MAX_GUESSES)].map((_, row) => {
          const guess = guesses[row] || "";

          return (
            <div key={row} className="flex gap-2">
              {[...Array(wordLength)].map((_, col) => {
                const letter = guess[col];

                const color = guess
                  ? getColor(letter, col)
                  : "bg-zinc-200 dark:bg-zinc-800";

                return (
                  <motion.div
                    key={col}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-12 h-12 flex items-center justify-center font-bold uppercase rounded ${color}`}
                  >
                    {letter}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>
      {!winner ? (
        <div className="flex gap-2 mb-6">
          <input
            value={input}
            maxLength={wordLength}
            onChange={(e) => setInput(e.target.value.toLowerCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitGuess();
            }}
            className="border px-3 py-2 bg-transparent"
          />

          <button onClick={submitGuess} className="px-4 py-2 border rounded">
            Guess
          </button>
        </div>
      ) : (
        <div className="mb-6 text-center">
          <div className="text-lg font-semibold mb-1">{winner} wins</div>

          <div className="text-zinc-500">
            The word was{" "}
            <span className="font-bold">{target.toUpperCase()}</span>
          </div>
        </div>
      )}

      <p className="mb-6 text-zinc-600">
        {thinking
          ? `${opponentName} thinking...`
          : winner
            ? `${winner} wins`
            : ""}
      </p>

      <button onClick={restart} className="px-6 py-2 border rounded-lg">
        Restart
      </button>
    </main>
  );
}
