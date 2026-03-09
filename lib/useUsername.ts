"use client";

import { useEffect, useState } from "react";

export function useUsername() {
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    let stored = localStorage.getItem("username");

    if (!stored || stored.trim() === "") {
      let name = prompt("Enter your username");

      if (!name || name.trim() === "") {
        name = "Player-" + Math.floor(Math.random() * 1000);
      }

      localStorage.setItem("username", name);
      stored = name;
    }

    setUsername(stored);
  }, []);

  return username;
}
