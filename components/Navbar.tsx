"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useOnlineCount } from "@/lib/useOnlineCount";
import { useUsernameStore } from "@/lib/useUsernameStore";

export default function Navbar() {
  const username = useUsernameStore();
  const online = useOnlineCount();

  return (
    <nav className="w-full h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-black dark:text-white">
      <Link href="/" className="font-bold text-xl">
        Quicky
      </Link>

      <div className="flex items-center gap-6 text-sm">
        {username && <span className="text-zinc-500">{username}</span>}

        <span className="text-green-500">
          ● {online ?? "..."}
        </span>

        <Link href="/">Home</Link>
        <Link href="/games">Games</Link>

        <ThemeToggle />
      </div>
    </nav>
  );
}