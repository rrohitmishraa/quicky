"use client";

import { useEffect, useState } from "react";
import { subscribeOnline } from "./realtimeStore";

export function useOnlineCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsub = subscribeOnline(setCount);
    return unsub;
  }, []);

  return count;
}
