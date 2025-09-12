"use client";
import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-wide text-white hover:opacity-90">
          Humanity
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/auth/sign-in" className="nav-link">Sign in</Link>
          <Link href="/auth/sign-up" className="btn-primary">Create account</Link>
        </nav>
      </div>
    </header>
  );
}
