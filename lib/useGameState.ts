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
  requestRematch,
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
  const [turn, setTurn] = useState<0 | 1>(0);
  const [playerIndex, setPlayerIndex] = useState<0 | 1>(0);
  const playerIndexRef = useRef<0 | 1>(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);

  const joined = useRef(false);

  useEffect(() => {
    playerIndexRef.current = playerIndex;
  }, [playerIndex]);

  /* ---------------- SOCKET EVENTS ---------------- */

  useEffect(() => {
    const listener = (event: any) => {
      switch (event.type) {
        case "start": {
          setSearching(false);
          setWinner(null);
          setDisconnectState("none");
          setRematchRequested(false);
          setOpponentWantsRematch(false);

          const { players, board, turn } = event.data;

          // use board from server if provided
          if (board) {
            setState([...board] as T);
          } else {
            setState([...initialState] as T);
          }

          // determine player index from server player list
          const myIndex = players.findIndex((p: any) => p.name === username);
          if (myIndex !== -1) {
            setPlayerIndex(myIndex as 0 | 1);
          }

          const opp = players.find((p: any) => p.name !== username);
          if (opp) setOpponentName(opp.name);

          // use server turn
          if (typeof turn === "number") {
            setTurn(turn as 0 | 1);
          } else {
            setTurn(0);
          }

          break;
        }

        case "move": {
          const { index, mark, turn } = event.data;
          setTurn(turn);

          setState((prev) => {
            const board = [...prev] as T;

            if (board[index] !== null) return prev;

            // normalize marks so local player is always "P"
            const localMark = playerIndex === 0 ? "P" : "O";
            const normalized = mark === localMark ? "P" : "O";

            board[index] = normalized;

            return board;
          });

          break;
        }

        case "gameOver": {
          const { winner, board } = event.data;

          if (board) {
            setState([...board] as T);
          }

          if (winner === "draw") {
            setWinner("draw");
          } else {
            // convert server winner to hero-view winner
            const localMark = playerIndexRef.current === 0 ? "P" : "O";
            const normalizedWinner = winner === localMark ? "P" : "O";
            setWinner(normalizedWinner);
          }

          // wait for UI to ask player: rematch or next player
          break;
        }

        case "opponentRematchRequested": {
          setOpponentWantsRematch(true);
          break;
        }

        case "rematchStart": {
          const { board, turn } = event.data;

          // reset board
          if (board) {
            setState([...board] as T);
          } else {
            setState([...initialState] as T);
          }

          // reset winner popup
          setWinner(null);

          // reset rematch request state
          setOpponentWantsRematch(false);
          setRematchRequested(false);

          // set new turn
          if (typeof turn === "number") {
            setTurn(turn as 0 | 1);
          }

          break;
        }

        case "turn": {
          // server forced a turn change (e.g., timer timeout)
          setTurn(event.turn);
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

    if (!username || username === "Opponent") {
      return () => unsubscribe(listener);
    }

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

    // only allow move if it is this client's turn
    if (turn !== playerIndex) return;

    // send move to server; server will broadcast the update
    sendMove(index);
  }

  /* ---------------- LEAVE MATCH ---------------- */

  function leaveMatch() {
    console.log("leaveMatch running");

    // notify server if still connected
    leaveGame();

    // clear local room state
    clearStoredRoom();

    // reset disconnect state
    setDisconnectState("none");
    setReconnectTimer(15);

    // reset board
    setState([...initialState] as T);

    // clear winner popup for next match
    setWinner(null);

    // reset opponent
    setOpponentName("Opponent");

    // allow matchmaking again
    joined.current = false;

    // start searching again
    setSearching(true);

    if (username) {
      console.log("Rejoining matchmaking...");
      joinGame(game, username);
      joined.current = true;
    }
  }

  function requestRematchAction() {
    setRematchRequested(true);
    requestRematch();
  }

  /* ---------------- RETURN ---------------- */

  return {
    state,
    opponentName,
    turn,
    playerIndex,
    playerTurn: turn === playerIndex,
    multiplayer: !searching,
    searching,
    winner,
    opponentWantsRematch,
    rematchRequested,
    disconnectState,
    reconnectTimer,
    playMove,
    leaveMatch,
    requestRematch: requestRematchAction,
  };
}
