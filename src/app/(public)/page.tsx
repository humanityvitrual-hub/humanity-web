"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";

const Earth = dynamic(() => import("@/components/Earth"), { ssr: false });

export default function LandingPage() {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-black">
      {/* Fondo 3D a pantalla completa */}
      <div className="absolute inset-0 -z-10">
        <Earth />
        {/* Vignette para legibilidad del copy */}
        <div className="pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.25)_50%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      {/* Contenido principal */}
      <section className="mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 lg:grid-cols-2 items-center gap-8 px-6 pt-[72px]">
        {/* Izquierda: texto y CTA */}
        <div className="max-w-xl">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-white">
            Explore the World<br/>in 3D
          </h1>
          <p className="mt-5 text-lg text-neutral-300">
            A virtual reality e-commerce platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/my-world"
              className="rounded-xl bg-white text-black px-5 py-3 text-sm font-medium hover:bg-white/90 transition"
            >
              Get Started
            </Link>
            <Link
              href="/about"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm text-white/90 hover:bg-white/10 transition"
            >
              Learn More
            </Link>
          </div>
          <p className="mt-14 text-xs text-neutral-500">© {new Date().getFullYear()} Humanity — Your Own World</p>
        </div>

        {/* Derecha: avatar */}
        <div className="relative hidden lg:block">
          {/* Si no existe la imagen, mostramos un placeholder circular */}
          <div className="relative ml-auto h-[520px] w-[360px]">
            <Image
              src="/images/assistant.jpg"
              alt="Assistant"
              fill
              sizes="360px"
              className="rounded-3xl object-cover"
              onErrorCapture={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = 'none';
                const ph = document.getElementById('ph-avatar');
                if (ph) ph.style.display = 'block';
              }}
            />
            <div
              id="ph-avatar"
              style={{display:'none'}}
              className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_30%_30%,#444,#111)] border border-white/10"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
