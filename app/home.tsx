"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import UsernameModal from "@/components/UsernameModal";

type Game = {
  name: string;
  slug: string;
};

const games: Game[] = [
  { name: "Tic Tac Toe", slug: "tic-tac-toe" },
  { name: "Connect 4", slug: "connect4" },
  { name: "Rock Paper Scissors", slug: "rps" },
];

export default function Home() {
  const router = useRouter();

  const [online, setOnline] = useState<number>(0);
  const [username, setUsername] = useState<string | null>(null);

  /* ---------------- USERNAME INIT ---------------- */

  useEffect(() => {
    const stored = localStorage.getItem("username");

    if (stored) {
      setUsername(stored);
    }
  }, []);

  function handleUsername(name: string) {
    localStorage.setItem("username", name);
    setUsername(name);
  }

  /* ---------------- SOCKET CONNECTION ---------------- */

  useEffect(() => {
    const socket = getSocket();

    socket.off("onlineCount");

    socket.on("onlineCount", (count: number) => {
      setOnline(count);
    });

    // request current count safely
    if (socket.connected) {
      socket.emit("getOnlineCount");
    } else {
      socket.once("connect", () => {
        socket.emit("getOnlineCount");
      });
    }

    return () => {
      socket.off("onlineCount");
    };
  }, []);

  /* ---------------- QUICK PLAY ---------------- */

  function handleQuickPlay() {
    const randomGame = games[Math.floor(Math.random() * games.length)];

    router.push(`/games/${randomGame.slug}`);
  }

  /* ---------------- UI ---------------- */

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-5xl font-bold mb-4 tracking-tight">Quicky</h1>

      <p className="text-zinc-600 dark:text-zinc-400 mb-12">
        Play simple games instantly
      </p>

      <div className="flex flex-col gap-6 w-72">
        {/* RANDOM PLAYER */}

        <button
          onClick={handleQuickPlay}
          className="w-full py-4 rounded-xl bg-green-500 text-black font-semibold hover:bg-green-400 transition"
        >
          Play with Random Player
        </button>

        {/* FRIENDS */}

        <Link
          href="/games"
          className="w-full py-4 rounded-xl text-center border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
        >
          Play with Friends
        </Link>
      </div>
    </main>
  );
}
