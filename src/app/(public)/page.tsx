"use client";
import dynamic from "next/dynamic";
import Link from "next/link";

const Earth = dynamic(() => import("@/components/Earth"), { ssr: false });

export default function LandingPage() {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-black">
      {/* 3D background fullscreen */}
      <div className="absolute inset-0 -z-10">
        <Earth />
        <div className="pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* Content (avoids header overlap) */}
      <section className="mx-auto flex min-h-[100svh] max-w-7xl items-center px-6 pt-[72px]">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-white">Your Own World</h1>
          <p className="mt-5 text-lg text-neutral-300">
            Build and explore your digital world. We provide the foundation for immersive,
            personalized, and scalable experiences.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/my-world"
              className="rounded-xl bg-white text-black px-5 py-3 text-sm font-medium hover:bg-white/90 transition"
            >
              Enter My World
            </Link>
            <Link
              href="/about"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm text-white/90 hover:bg-white/10 transition"
            >
              Learn More
            </Link>
          </div>

          <p className="mt-16 pb-10 text-xs text-neutral-500">
            © {new Date().getFullYear()} Humanity — Your Own World
          </p>
        </div>
      </section>
    </main>
  );
}
