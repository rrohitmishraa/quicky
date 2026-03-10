"use client"

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

    <main className="min-h-screen flex flex-col items-center justify-start pt-24 px-6 bg-white dark:bg-black text-black dark:text-white">

      {/* USERNAME MODAL */}

      {!username && (
        <UsernameModal onSubmit={handleUsername} />
      )}

      {/* USERNAME DISPLAY */}

      {username && (
        <div className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Welcome, <span className="font-semibold">{username}</span>
        </div>
      )}

      {/* HERO */}

      <h1 className="text-5xl font-bold mb-4 tracking-tight">
        Quicky
      </h1>

      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Play simple games with random people instantly
      </p>

      {/* ONLINE COUNT */}

      <div className="text-green-500 text-sm mb-10">
        ● {online} players online
      </div>

      {/* QUICK PLAY */}

      <button
        onClick={handleQuickPlay}
        className="px-8 py-3 mb-16 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-400 hover:scale-105 transition"
      >
        Play Now
      </button>

      {/* GAMES */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {games.map((game) => (

          <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            className="w-64 h-36 rounded-xl flex items-center justify-center text-lg font-semibold border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:scale-105 transition"
          >

            {game.name}

          </Link>

        ))}

      </div>

    </main>

  );

}