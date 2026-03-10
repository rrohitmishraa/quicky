"use client";

import { io, Socket } from "socket.io-client";

declare global {
  var __socket: Socket | undefined;
}

export function getSocket(): Socket {
  if (typeof window === "undefined") {
    return {} as Socket;
  }

  if (window.__socket) return window.__socket;

  const SERVER_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

  window.__socket = io(SERVER_URL, {
    transports: ["websocket"], // force websocket
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  window.__socket.on("connect", () => {
    console.log("Socket connected:", window.__socket?.id);
  });

  window.__socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  window.__socket.on("connect_error", (err) => {
    console.log("Socket connection error:", err.message);
  });

  return window.__socket;
}
