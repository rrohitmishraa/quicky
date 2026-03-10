"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { useGameState } from "@/lib/useGameState";
import { useUsername } from "@/lib/useUsername";
import { getSocket } from "@/lib/socket";
import { getCurrentRoom } from "@/lib/multiplayerEngine";
import Modal from "@/components/Modal";

type Cell = "P" | "O" | null;

const TURN_TIME = 30;

const initialBoard: Cell[] = Array(9).fill(null);

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

  const [timer, setTimer] = useState(TURN_TIME);
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  /* ---------------- WIN CHECK ---------------- */

  function checkWinner(board: Cell[]) {
    for (const [a, b, c] of winPatterns) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinningCells([a, b, c]);
        return { winner: board[a] };
      }
    }

    if (!board.includes(null)) {
      return { winner: "draw" };
    }

    return null;
  }


  /* ---------------- MULTIPLAYER ENGINE ---------------- */

  const {
    state: board = initialBoard,
    playerTurn,
    playerIndex,
    opponentName,
    searching,
    multiplayer,
    winner,
    opponentWantsRematch,
    rematchRequested,
    disconnectState,
    reconnectTimer,
    playMove,
    leaveMatch,
    requestRematch,
  } = useGameState<Cell[]>(
    username,
    "tictactoe",
    initialBoard
  );


  /* ---------------- STATUS ---------------- */

  function status() {
    if (searching) return "Waiting for a player...";

    if (disconnectState === "waiting") {
      return `Opponent disconnected (reconnect in ${reconnectTimer}s)`;
    }

    if (winner === "P") return `You Win!`;
    if (winner === "O") return `${opponentName} wins!`;
    if (winner === "draw") return "Draw";

    if (!opponentName || opponentName === "Opponent") {
      return "Game starting...";
    }

    return playerTurn ? `Your turn` : `${opponentName}'s turn`;
  }

  /* ---------------- PLAYER MOVE ---------------- */

  function playerMove(index: number) {
    if (searching) return;
    if (disconnectState === "waiting") return;
    if (!playerTurn) return;
    if (board[index]) return;
    if (winner) return;

    playMove(index);
  }

  /* ---------------- TIMER ---------------- */

  // reset timer whenever the board changes (new turn)
  useEffect(() => {
    setTimer(TURN_TIME);
  }, [board]);

  // countdown timer
  useEffect(() => {
    if (winner || searching) return;

    const interval = setInterval(() => {
      setTimer((t) => {
        // when timer reaches 0, simply reset for next turn
        if (t <= 1) {
          // only the active player should trigger the timeout
          if (playerTurn) {
            const socket = getSocket();
            const room = getCurrentRoom();

            if (room) {
              socket.emit("turnTimeout", { room });
            }
          }

          return TURN_TIME;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [winner, searching, board, playerTurn]);

  /* ---------------- POPUP TRIGGER ---------------- */

  useEffect(() => {
    if (!winner) return;

    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [winner]);

  useEffect(() => {
    if (!winner) {
      setShowPopup(false);
    }
  }, [winner]);

  /* ---------------- UI ---------------- */

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-3xl font-bold mb-4">Tic Tac Toe</h1>

      <div className="flex gap-10 mb-4 text-sm">
        <div>You (X)</div>
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
              {cell && (() => {
                // convert server mark to hero view
                const serverIndex = cell === "P" ? 0 : 1;
                const display = serverIndex === playerIndex ? "X" : "O";

                return (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className={`${display === "X" ? "text-red-500" : "text-yellow-500"} ${isWinning ? "animate-pulse text-green-500" : ""}`}
                  >
                    {display}
                  </motion.div>
                );
              })()}
            </button>
          );
        })}
      </div>

      {showPopup && (
        <Modal
          title={status()}
          actions={
            <div className="flex gap-3">
              {!rematchRequested && !opponentWantsRematch && (
                <button
                  onClick={requestRematch}
                  className="px-5 py-2 bg-green-500 text-black rounded-lg"
                >
                  Rematch
                </button>
              )}

              {opponentWantsRematch && !rematchRequested && (
                <button
                  onClick={requestRematch}
                  className="px-5 py-2 bg-green-500 text-black rounded-lg"
                >
                  Accept Rematch
                </button>
              )}

              <button
                onClick={leaveMatch}
                className="px-5 py-2 bg-blue-500 text-black rounded-lg"
              >
                Next Player
              </button>
            </div>
          }
        >
          {!rematchRequested && !opponentWantsRematch && (
            <p className="text-sm text-zinc-500">
              Do you want a rematch or find the next player?
            </p>
          )}

          {rematchRequested && (
            <p className="text-sm text-zinc-500">
              Waiting for opponent to accept rematch...
            </p>
          )}

          {opponentWantsRematch && !rematchRequested && (
            <p className="text-sm text-zinc-500">
              Opponent wants a rematch.
            </p>
          )}
        </Modal>
      )}

      {disconnectState === "waiting" && (
        <Modal
          title="Opponent disconnected"
          actions={
            <button
              type="button"
              onClick={() => {
                console.log("Leave Match clicked");
                leaveMatch();
              }}
              className="px-5 py-2 bg-red-500 text-black rounded-lg"
            >
              Leave Match
            </button>
          }
        >
          <p className="text-sm text-zinc-500">
            Waiting for opponent to reconnect... ({reconnectTimer}s)
          </p>
        </Modal>
      )}
    </main>
  );
}