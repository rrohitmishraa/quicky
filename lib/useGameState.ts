"use client";

import { useEffect, useRef, useState } from "react";
import {
  subscribe,
  unsubscribe,
  joinGame,
  sendMove,
  leaveGame,
  reconnectGame,
  getCurrentRoom,
  clearStoredRoom,
} from "./multiplayerEngine";

export function useGameState<T extends (string | null)[]>(
  username: string,
  game: string,
  initialState: T,
) {
  const [state, setState] = useState<T>(() => [...initialState] as T);
  const [opponentName, setOpponentName] = useState("Opponent");
  const [searching, setSearching] = useState(true);

  const [disconnectState, setDisconnectState] = useState<"none" | "waiting">(
    "none",
  );
  const [reconnectTimer, setReconnectTimer] = useState(15);

  const joined = useRef(false);

  /* ---------------- SOCKET EVENTS ---------------- */

  useEffect(() => {
    const listener = (event: any) => {
      switch (event.type) {
        case "start": {
          setSearching(false);

          const opp = event.data.players.find((p: any) => p.name !== username);

          if (opp) setOpponentName(opp.name);
          break;
        }

        case "move": {
          const { index, mark } = event.data;

          setState((prev) => {
            const board = [...prev] as T;

            if (board[index] !== null) return prev;

            board[index] = mark;

            return board;
          });

          break;
        }

        case "disconnect": {
          setDisconnectState("waiting");

          setReconnectTimer(15);

          const interval = setInterval(() => {
            setReconnectTimer((t) => {
              if (t <= 1) {
                clearInterval(interval);
                return 0;
              }
              return t - 1;
            });
          }, 1000);

          // stop timer if player reconnects or leaves
          const stop = () => clearInterval(interval);
          setTimeout(stop, 15000);

          break;
        }

        case "reconnect": {
          setDisconnectState("none");
          break;
        }

        case "left": {
          setSearching(true);
          setOpponentName("Opponent");

          setState([...initialState] as T);
          joined.current = false;

          clearStoredRoom();

          break;
        }
      }
    };

    subscribe(listener);
    if (!username || username === "Opponent") return;
    console.log("Attempting matchmaking with:", username);

    if (!joined.current) {
      clearStoredRoom();

      const room = getCurrentRoom();

      if (room) {
        reconnectGame(room, username);
      } else {
        console.log("Joining matchmaking:", username);
        joinGame(game, username);
      }

      joined.current = true;
    }

    return () => {
      unsubscribe(listener);
    };
  }, [username]);

  /* ---------------- PLAYER MOVE ---------------- */

  function playMove(index: number) {
    if (searching) return;

    setState((prev) => {
      const board = [...prev] as T;

      if (board[index] !== null) return prev;

      board[index] = "P";

      return board;
    });

    sendMove(index);
  }

  /* ---------------- LEAVE MATCH ---------------- */

  function leaveMatch() {
    leaveGame();

    clearStoredRoom();

    joined.current = false;

    setSearching(true);
    setOpponentName("Opponent");
    setState([...initialState] as T);
  }

  /* ---------------- RETURN ---------------- */

  return {
    state,
    opponentName,
    playerTurn: true,
    multiplayer: !searching,
    searching,
    winner: null,
    disconnectState,
    reconnectTimer,
    playMove,
    leaveMatch,
  };
}
