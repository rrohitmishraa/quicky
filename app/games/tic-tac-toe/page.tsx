"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { joinGame, sendMove, onMove, onGameStart } from "@/lib/multiplayer";
import { useUsername } from "@/lib/useUsername";

type Cell = "P" | "O" | null;

const TURN_TIME = 30;
const MATCH_WAIT_TIME = 15000;

const winPatterns = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export default function TicTacToe() {
  const username = useUsername();

  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [winner, setWinner] = useState<Cell | "draw" | null>(null);
  const [winningCells, setWinningCells] = useState<number[]>([]);

  const [playerTurn, setPlayerTurn] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [timer, setTimer] = useState(TURN_TIME);

  const [multiplayer, setMultiplayer] = useState(false);
  const [searching, setSearching] = useState(true);

  const [opponentName, setOpponentName] = useState("Opponent");

  const [showPopup, setShowPopup] = useState(false);

  const playerName = username;

  /* MATCHMAKING */

  useEffect(() => {
    if (!username) return;

    joinGame("tictactoe", username);

    const waitTimer = setTimeout(() => {
      if (!multiplayer) {
        setSearching(false);
      }
    }, MATCH_WAIT_TIME);

    onGameStart((data: any) => {
      clearTimeout(waitTimer);

      setMultiplayer(true);
      setSearching(false);

      const opponent = data.players.find((p: any) => p.name !== username);

      if (opponent) {
        setOpponentName(opponent.name);
      }
    });

    onMove((index: number) => {
      setBoard((prev) => {
        const newBoard = [...prev];
        newBoard[index] = "O";

        const result = checkWinner(newBoard);

        if (result) {
          triggerWin(result);
        }

        return newBoard;
      });

      setPlayerTurn(true);
      setThinking(false);
      setTimer(TURN_TIME);
    });
  }, [username]);

  /* WIN CHECK */

  function checkWinner(board: Cell[]) {
    for (const [a, b, c] of winPatterns) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], cells: [a, b, c] };
      }
    }

    if (!board.includes(null)) {
      return { winner: "draw", cells: [] };
    }

    return null;
  }

  /* WIN HANDLER */

  function triggerWin(result: any) {
    setWinner(result.winner);
    setWinningCells(result.cells);

    setTimeout(() => {
      setShowPopup(true);
    }, 2000);
  }

  /* MINIMAX BOT */

  function minimax(newBoard: Cell[], player: Cell) {
    const result = checkWinner(newBoard);

    if (result) {
      if (result.winner === "P") return -10;
      if (result.winner === "O") return 10;
      return 0;
    }

    const moves: number[] = [];

    for (let i = 0; i < 9; i++) {
      if (!newBoard[i]) moves.push(i);
    }

    if (player === "O") {
      let best = -Infinity;

      for (const i of moves) {
        newBoard[i] = "O";
        const score = minimax(newBoard, "P");
        newBoard[i] = null;

        best = Math.max(score, best);
      }

      return best;
    } else {
      let best = Infinity;

      for (const i of moves) {
        newBoard[i] = "P";
        const score = minimax(newBoard, "O");
        newBoard[i] = null;

        best = Math.min(score, best);
      }

      return best;
    }
  }

  function bestMove(board: Cell[]) {
    let bestScore = -Infinity;
    let move = -1;

    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "O";
        const score = minimax(board, "P");
        board[i] = null;

        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }

    return move;
  }

  /* PLAYER MOVE */

  function playerMove(index: number) {
    if (searching) return;
    if (!playerTurn || thinking || winner) return;
    if (board[index]) return;

    const newBoard = [...board];
    newBoard[index] = "P";

    const result = checkWinner(newBoard);

    setBoard(newBoard);

    if (multiplayer) {
      sendMove(index);
    }

    if (result) {
      triggerWin(result);
      return;
    }

    setPlayerTurn(false);
    setThinking(true);
    setTimer(TURN_TIME);

    if (!multiplayer) {
      const delay = 500 + Math.random() * 3500;

      setTimeout(() => {
        opponentMove(newBoard);
      }, delay);
    }
  }

  /* BOT MOVE */

  function opponentMove(currentBoard: Cell[]) {
    const newBoard = [...currentBoard];

    const move = bestMove(newBoard);

    if (move !== -1) {
      newBoard[move] = "O";
    }

    const result = checkWinner(newBoard);

    setBoard(newBoard);

    if (result) {
      triggerWin(result);
      return;
    }

    setPlayerTurn(true);
    setThinking(false);
    setTimer(TURN_TIME);
  }

  /* TIMER */

  useEffect(() => {
    if (winner || searching) return;

    if (timer === 0) {
      if (playerTurn) {
        setPlayerTurn(false);
        setThinking(true);

        const delay = 500 + Math.random() * 2000;

        setTimeout(() => {
          opponentMove(board);
        }, delay);
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
  }, [timer, playerTurn, winner, searching]);

  /* RESTART */

  function restart() {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningCells([]);
    setPlayerTurn(true);
    setThinking(false);
    setTimer(TURN_TIME);
    setShowPopup(false);
  }

  function nextOpponent() {
    setShowPopup(false);
    window.location.reload();
  }

  /* STATUS */

  function status() {
    if (searching) return "Waiting for a player to join...";

    if (winner === "P") return `${playerName} wins!`;
    if (winner === "O") return `${opponentName} wins!`;
    if (winner === "draw") return "Draw";

    if (thinking) return `${opponentName} thinking...`;

    return `${playerName}'s turn`;
  }

  /* UI */

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-3xl font-bold mb-4">Tic Tac Toe</h1>

      <div className="flex gap-10 mb-4 text-sm">
        <div>{playerName} (X)</div>
        <div>{opponentName} (O)</div>
      </div>

      <div className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Time left: {timer}s
      </div>

      <p className="mb-6 text-zinc-600 dark:text-zinc-400">{status()}</p>

      <div className="grid grid-cols-3 gap-3">
        {board.map((cell, i) => {
          const isWinning = winningCells.includes(i);

          return (
            <button
              key={i}
              onClick={() => playerMove(i)}
              className="w-24 h-24 flex items-center justify-center text-3xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            >
              {cell && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className={`${cell === "P" ? "text-red-500" : "text-yellow-500"} ${isWinning ? "animate-pulse text-green-500" : ""}`}
                >
                  {cell === "P" ? "X" : "O"}
                </motion.div>
              )}
            </button>
          );
        })}
      </div>

      {/* POPUP */}

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl text-center space-y-6">
            <h2 className="text-xl font-semibold">{status()}</h2>

            <div className="flex gap-4 justify-center">
              <button
                onClick={restart}
                className="px-5 py-2 bg-green-500 text-black rounded-lg"
              >
                Rematch
              </button>

              <button
                onClick={nextOpponent}
                className="px-5 py-2 bg-blue-500 text-black rounded-lg"
              >
                Next Player
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
