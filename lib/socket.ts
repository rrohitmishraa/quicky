"use client";

import { io, Socket } from "socket.io-client";

declare global {
  interface Window {
    __socket?: Socket;
  }
}

const SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

function createSocket(): Socket {
  if (typeof window === "undefined") {
    return {} as Socket;
  }

  if (window.__socket) return window.__socket;

  const socket = io(SERVER_URL, {
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.log("Socket connection error:", err.message);
  });

  window.__socket = socket;

  return socket;
}

export function getSocket(): Socket {
  return createSocket();
}

/* Initialize socket immediately when this file loads */
if (typeof window !== "undefined") {
  createSocket();
}
