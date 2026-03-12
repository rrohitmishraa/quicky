"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { getSocket } from "@/lib/socket";

export default function Navbar() {
  const [username, setUsername] = useState<string | null>(null);
  const [online, setOnline] = useState<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) setUsername(stored);

    const socket = getSocket();

    const handleOnline = (count: number) => {
      setOnline(count);
    };

    socket.on("onlineCount", handleOnline);

    const request = () => {
      socket.emit("getOnlineCount");
    };

    // request AFTER connection
    if (socket.connected) {
      request();
    } else {
      socket.on("connect", request);
    }

    return () => {
      socket.off("onlineCount", handleOnline);
      socket.off("connect", request);
    };
  }, []);

  return (
    <nav className="w-full h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-black dark:text-white">
      <Link href="/" className="font-bold text-xl">
        Quicky
      </Link>

      <div className="flex items-center gap-6 text-sm">
        {username && <span className="text-zinc-500">{username}</span>}

        <span className="text-green-500">● {online}</span>

        <Link href="/">Home</Link>
        <Link href="/games">Games</Link>

        <ThemeToggle />
      </div>
    </nav>
  );
}
