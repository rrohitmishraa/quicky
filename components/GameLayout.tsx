"use client";

export default function GameLayout({
  title,
  playerName,
  opponentName,
  status,
  timer,
  children,
}: any) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-black text-black dark:text-white">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>

      <div className="flex gap-10 mb-4 text-sm">
        <div>{playerName} (X)</div>
        <div>{opponentName} (O)</div>
      </div>

      {timer !== undefined && (
        <div className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Time left: {timer}s
        </div>
      )}

      <p className="mb-6 text-zinc-600 dark:text-zinc-400">{status}</p>

      {children}
    </main>
  );
}
