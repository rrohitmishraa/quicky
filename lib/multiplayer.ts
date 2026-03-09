import { getSocket } from "./socket";

let room: string | null = null;

/* ---------------- JOIN GAME ---------------- */

export function joinGame(game: string, username: string) {
  const socket = getSocket();

  socket.emit("joinGame", {
    game,
    username,
  });
}

/* ---------------- GAME START ---------------- */

export function onGameStart(callback: any) {
  const socket = getSocket();

  socket.off("gameStart");

  socket.on("gameStart", (data) => {
    room = data.room;

    callback(data);
  });
}

/* ---------------- PLAYER MOVE ---------------- */

export function sendMove(index: number) {
  const socket = getSocket();

  if (!room) return;

  socket.emit("move", {
    room,
    index,
  });
}

export function onMove(callback: any) {
  const socket = getSocket();

  socket.off("move");

  socket.on("move", callback);
}

/* ---------------- REMATCH ---------------- */

export function sendRematchChoice(choice: "rematch" | "next") {
  const socket = getSocket();

  if (!room) return;

  socket.emit("rematchChoice", {
    room,
    choice,
  });
}

export function onRematchUpdate(callback: any) {
  const socket = getSocket();

  socket.off("rematchUpdate");

  socket.on("rematchUpdate", callback);
}

/* ---------------- OPPONENT LEFT ---------------- */

export function onOpponentLeft(callback: any) {
  const socket = getSocket();

  socket.off("opponentLeft");

  socket.on("opponentLeft", callback);
}

/* ---------------- RESET ROOM ---------------- */

export function resetRoom() {
  room = null;
}
