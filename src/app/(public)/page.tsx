"use client";
import dynamic from "next/dynamic";
import Link from "next/link";

const Earth = dynamic(() => import("@/components/Earth"), { ssr: false });

export default function LandingPage() {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-black page-pad">
      {/* 3D background */}
      <div className="absolute inset-0 -z-10">
        <Earth />
        {/* vignette for readability */}
        <div className="pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* Hero content */}
      <section className="mx-auto flex min-h-[calc(100svh-72px)] max-w-7xl items-center px-6">
        <div className="max-w-2xl">
          <h1 className="hero-h1">Your Own World</h1>
          <p className="hero-p">
            Build and explore your digital world. We provide the foundation for immersive,
            personalized, and scalable experiences.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/my-world" className="btn-primary">Enter My World</Link>
            <Link href="/about" className="btn-ghost">Learn More</Link>
          </div>
          <p className="mt-16 pb-10 text-xs text-neutral-500">
            © {new Date().getFullYear()} Humanity — Your Own World
          </p>
        </div>
      </section>
    </main>
  );
}
