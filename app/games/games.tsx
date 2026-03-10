import fs from "fs";
import path from "path";
import Link from "next/link";

export default function GamesPage() {
  const gamesPath = path.join(process.cwd(), "app/games");

  const folders = fs
    .readdirSync(gamesPath, { withFileTypes: true })
    .filter((dir) => dir.isDirectory() && !dir.name.startsWith("_"))
    .map((dir) => dir.name);

  return (
    <main className="min-h-screen flex flex-col items-center pt-24 px-6 bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-4xl font-bold mb-12">Games</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {folders.map((game) => {
          const title = game
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

          return (
            <Link
              key={game}
              href={`/games/${game}`}
              className="w-64 h-36 flex items-center justify-center text-lg font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:scale-105 transition"
            >
              {title}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
