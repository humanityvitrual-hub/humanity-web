"use client";

import Link from "next/link";
import Logo from "./Logo";
import Button from "./ui/Button";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/about" className="text-neutral-300 hover:text-white">
            About
          </Link>
          <Button asLink href="/auth/sign-in" variant="primary">
            My World
          </Button>
        </nav>
      </div>
    </header>
  );
}
