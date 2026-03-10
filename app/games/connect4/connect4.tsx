"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type Cell = "P" | "O" | null;

const ROWS = 6;
const COLS = 7;
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

export default function Connect4() {
  const emptyBoard = () =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  const [board, setBoard] = useState<Cell[][]>(emptyBoard);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [winner, setWinner] = useState<Cell | null>(null);
  const [winningCells, setWinningCells] = useState<string[]>([]);
  const [timer, setTimer] = useState(TURN_TIME);

  const playerName = "You";
  const [opponentName] = useState(
    opponentNames[Math.floor(Math.random() * opponentNames.length)],
  );

  /* ---------------- WIN CHECK ---------------- */

  function checkWinner(board: Cell[][]) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = board[r][c];
        if (!cell) continue;

        const directions = [
          [0, 1],
          [1, 0],
          [1, 1],
          [-1, 1],
        ];

        for (const [dr, dc] of directions) {
          const cells = [`${r}-${c}`];

          for (let i = 1; i < 4; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;

            if (
              nr >= 0 &&
              nr < ROWS &&
              nc >= 0 &&
              nc < COLS &&
              board[nr][nc] === cell
            ) {
              cells.push(`${nr}-${nc}`);
            } else {
              break;
            }
          }

          if (cells.length === 4) {
            return { winner: cell, cells };
          }
        }
      }
    }

    return null;
  }

  /* ---------------- DROP PIECE ---------------- */

  function dropPiece(board: Cell[][], col: number, piece: Cell) {
    const newBoard = board.map((r) => [...r]);

    for (let row = ROWS - 1; row >= 0; row--) {
      if (!newBoard[row][col]) {
        newBoard[row][col] = piece;
        return newBoard;
      }
    }

    return null;
  }

  /* ---------------- APPLY MOVE ---------------- */

  function applyMove(updated: Cell[][]) {
    const result = checkWinner(updated);

    if (result) {
      setWinner(result.winner);
      setWinningCells(result.cells);
    }

    setBoard(updated);
    setPlayerTurn(true);
    setThinking(false);
    setTimer(TURN_TIME);
  }

  /* ---------------- PLAYER MOVE ---------------- */

  function playerMove(col: number) {
    if (!playerTurn || thinking || winner) return;

    const updated = dropPiece(board, col, "P");
    if (!updated) return;

    const result = checkWinner(updated);

    setBoard(updated);

    if (result) {
      setWinner(result.winner);
      setWinningCells(result.cells);
      return;
    }

    setPlayerTurn(false);
    setThinking(true);
    setTimer(TURN_TIME);

    const delay = 500 + Math.random() * 3500;

    setTimeout(() => opponentMove(updated), delay);
  }

  /* ---------------- AI MOVE ---------------- */

  function opponentMove(currentBoard: Cell[][]) {
    const validCols: number[] = [];

    for (let c = 0; c < COLS; c++) {
      if (!currentBoard[0][c]) validCols.push(c);
    }

    if (!validCols.length) return;

    /* try win */

    for (const col of validCols) {
      const test = dropPiece(currentBoard, col, "O");

      if (test) {
        const res = checkWinner(test);
        if (res?.winner === "O") {
          applyMove(test);
          return;
        }
      }
    }

    /* block player */

    for (const col of validCols) {
      const test = dropPiece(currentBoard, col, "P");

      if (test) {
        const res = checkWinner(test);
        if (res?.winner === "P") {
          const block = dropPiece(currentBoard, col, "O");
          if (block) {
            applyMove(block);
            return;
          }
        }
      }
    }

    /* center */

    if (validCols.includes(3)) {
      const center = dropPiece(currentBoard, 3, "O");

      if (center) {
        applyMove(center);
        return;
      }
    }

    /* random */

    const col = validCols[Math.floor(Math.random() * validCols.length)];

    const updated = dropPiece(currentBoard, col, "O");

    if (updated) applyMove(updated);
  }

  /* ---------------- TIMER ---------------- */

  useEffect(() => {
    if (winner) return;

    if (timer === 0) {
      if (playerTurn) {
        setPlayerTurn(false);
        setThinking(true);

        const delay = 500 + Math.random() * 2000;

        setTimeout(() => opponentMove(board), delay);
      } else {
        setPlayerTurn(true);
        setThinking(false);
      }

      setTimer(TURN_TIME);
    }

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, playerTurn, winner]);

  /* ---------------- STATUS ---------------- */

  function status() {
    if (winner === "P") return `${playerName} wins!`;
    if (winner === "O") return `${opponentName} wins!`;

    if (thinking) return `${opponentName} thinking...`;

    return `${playerName}'s turn`;
  }

  /* ---------------- RESTART ---------------- */

  function restart() {
    setBoard(emptyBoard());
    setWinner(null);
    setWinningCells([]);
    setPlayerTurn(true);
    setThinking(false);
    setTimer(TURN_TIME);
  }

  /* ---------------- UI ---------------- */

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-3xl font-bold mb-4">Connect 4</h1>

      <div className="flex gap-10 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          {playerName}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
          {opponentName}
        </div>
      </div>

      <div className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Time left: {timer}s
      </div>

      <p className="mb-6 text-zinc-600 dark:text-zinc-400">{status()}</p>

      <div className="grid grid-cols-7 gap-2">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const id = `${r}-${c}`;
            const isWinning = winningCells.includes(id);

            return (
              <button
                key={id}
                onClick={() => playerMove(c)}
                className="w-14 h-14 rounded-full flex items-center justify-center border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              >
                {cell && (
                  <motion.div
                    initial={{ y: -120, scale: 0.6 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 250 }}
                    className={`w-10 h-10 rounded-full ${cell === "P" ? "bg-red-500" : "bg-yellow-400"
                      } ${isWinning ? "ring-4 ring-green-400 animate-pulse" : ""}`}
                  />
                )}
              </button>
            );
          }),
        )}
      </div>

      <button
        onClick={restart}
        className="mt-8 px-6 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
      >
        Restart
      </button>
    </main>
  );
}
