"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const [online, setOnline] = useState<number>(0);
  const router = useRouter();

  const handleQuickPlay = () => {
    const randomGame = games[Math.floor(Math.random() * games.length)];
    router.push(`/games/${randomGame.slug}`);
  };

  useEffect(() => {
    setOnline(Math.floor(Math.random() * 100) + 50);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-28 px-6 bg-white dark:bg-black text-black dark:text-white">

      {/* Hero */}

      <h1 className="text-5xl font-bold mb-4 tracking-tight">
        Quicky
      </h1>

      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Play simple games with random people instantly
      </p>

      {/* Online users */}

      <div className="text-green-500 text-sm mb-10">
        ● {online} players online
      </div>

      {/* Quick play */}

      <button
        onClick={handleQuickPlay}
        className="px-8 py-3 mb-16 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-400 hover:scale-105 transition"
      >
        Play Now
      </button>

      {/* Games */}

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