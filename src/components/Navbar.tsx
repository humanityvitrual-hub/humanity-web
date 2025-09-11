'use client';
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="pointer-events-auto fixed inset-x-0 top-0 z-20">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-wide text-white/90 hover:text-white">
          Humanity
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/about" className="text-white/70 hover:text-white">About</Link>
          <Link href="/auth/sign-in" className="text-white/70 hover:text-white">Sign in</Link>
          <Link
            href="/auth/sign-up"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-white hover:bg-white/20"
          >
            Create account
          </Link>
        </div>
      </nav>
    </header>
  );
}
