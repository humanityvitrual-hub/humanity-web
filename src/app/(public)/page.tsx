'use client';
import Link from 'next/link';
import Earth from '@/components/Earth';

export default function LandingPage() {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-black">
      {/* 3D background */}
      <div className="absolute inset-0">
        <Earth />
        {/* overlay de contraste */}
        <div className="pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-center px-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white">
            Your Own World
          </h1>
          <p className="mt-5 text-lg text-neutral-300">
            Build and explore your digital world. We provide a scalable foundation for immersive,
            personalized experiences.
          </p>

          <div className="mt-8 flex gap-3">
            <Link
              href="/my-world"
              className="rounded-xl bg-white/10 border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/15 transition"
            >
              Enter My World
            </Link>
            <Link
              href="/about"
              className="rounded-xl bg-white/0 border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/5 transition"
            >
              Learn More
            </Link>
          </div>

          <p className="mt-16 pb-8 text-xs text-neutral-500">
            © {new Date().getFullYear()} Humanity — Your Own World
          </p>
        </div>
      </div>
    </main>
  );
}
