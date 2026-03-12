"use client";

import { useEffect, useState } from "react";
import { subscribeUsername } from "./usernameStore";

export function useUsernameStore() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeUsername(setUsername);
    return unsub;
  }, []);

  return username;
}
