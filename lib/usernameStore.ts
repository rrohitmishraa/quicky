"use client";

type Listener = (name: string | null) => void;

let username: string | null = null;
let listeners: Listener[] = [];

export function initUsername() {
  if (username !== null) return;

  const stored = localStorage.getItem("username");
  username = stored || null;
}

export function getUsername() {
  return username;
}

export function setUsername(name: string) {
  username = name;
  localStorage.setItem("username", name);

  listeners.forEach((l) => l(username));
}

export function subscribeUsername(listener: Listener) {
  initUsername();

  listeners.push(listener);

  listener(username);

  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
