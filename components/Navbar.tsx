import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="w-full h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-black dark:text-white">

      <Link href="/" className="font-bold text-xl">
        Quicky
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/">Home</Link>
        <Link href="/games">Games</Link>
        <ThemeToggle />
      </div>

    </nav>
  );
}