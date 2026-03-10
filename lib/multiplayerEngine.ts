import { getSocket } from "./socket";

type Listener = (data: any) => void;

let room: string | null = null;
let listeners: Listener[] = [];

let initialized = false;

function initSocket() {
  if (initialized) return;
  if (typeof window === "undefined") return;

  const socket = getSocket();

  socket.off("gameStart");
  socket.on("gameStart", (data) => {
    room = data.room;
    sessionStorage.setItem("currentRoom", data.room);

    dispatch({
      type: "start",
      data,
    });
  });

  socket.off("move");
  socket.on("move", (data) => {
    dispatch({
      type: "move",
      data,
    });
  });

  socket.off("turnUpdate");
  socket.on("turnUpdate", (data) => {
    dispatch({
      type: "turn",
      turn: data.turn,
    });
  });

  socket.off("opponentDisconnected");
  socket.on("opponentDisconnected", () => {
    dispatch({
      type: "disconnect",
    });
  });

  socket.off("opponentReconnected");
  socket.on("opponentReconnected", () => {
    dispatch({
      type: "reconnect",
    });
  });

  socket.off("opponentLeft");
  socket.on("opponentLeft", () => {
    room = null;
    sessionStorage.removeItem("currentRoom");

    dispatch({
      type: "left",
    });
  });

  initialized = true;
}

function emit(event: string, payload?: any) {
  if (typeof window === "undefined") return;

  const socket = getSocket();

  // Socket.IO automatically queues emits until connected
  socket.emit(event, payload);
}

function dispatch(data: any) {
  listeners.forEach((l) => {
    try {
      l(data);
    } catch (err) {
      console.error("Listener error:", err);
    }
  });
}

export function subscribe(listener: Listener) {
  // avoid duplicate subscriptions
  if (!listeners.includes(listener)) {
    listeners.push(listener);
  }
  initSocket();
}

export function unsubscribe(listener: Listener) {
  listeners = listeners.filter((l) => l !== listener);
}

export function joinGame(game: string, username: string) {
  initSocket();

  // clear any stale room from previous sessions
  room = null;
  sessionStorage.removeItem("currentRoom");

  const socket = getSocket();
  socket.emit("joinGame", { game, username });
}

export function sendMove(index: number) {
  if (!room) return;

  initSocket();

  emit("move", {
    room,
    index,
  });
}

export function leaveGame() {
  if (!room) return;

  initSocket();

  emit("leaveRoom", room);

  room = null;
}

export function reconnectGame(roomId: string, username: string) {
  if (!roomId) return;

  initSocket();

  // keep local state in sync
  room = roomId;
  sessionStorage.setItem("currentRoom", roomId);

  emit("reconnectGame", {
    roomId,
    username,
  });
}

export function getCurrentRoom() {
  return room || sessionStorage.getItem("currentRoom");
}

export function clearStoredRoom() {
  room = null;
  sessionStorage.removeItem("currentRoom");
}
