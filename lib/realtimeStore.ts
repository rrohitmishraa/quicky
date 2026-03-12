"use client";

import { getSocket } from "./socket";

type Listener = (count: number) => void;

let onlineCount: number | null = null;
let listeners: Listener[] = [];
let initialized = false;

function init() {
  if (initialized) return;

  const socket = getSocket();

  socket.on("onlineCount", (count: number) => {
    onlineCount = count;
    listeners.forEach((l) => l(count));
  });

  // ALWAYS request count after connect
  const requestCount = () => {
    socket.emit("getOnlineCount");
  };

  socket.on("connect", requestCount);

  // also request immediately in case already connected
  if (socket.connected) {
    requestCount();
  }

  initialized = true;
}

export function subscribeOnline(listener: Listener) {
  init();

  if (!listeners.includes(listener)) {
    listeners.push(listener);
  }

  if (onlineCount !== null) {
    listener(onlineCount);
  }

  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
