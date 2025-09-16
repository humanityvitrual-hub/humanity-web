'use client';
import HumanAvatar from '@/components/HumanAvatar';
import TalkingHead3D from "@/components/TalkingHead3D";

import Header from '@/components/Header';

export default function Landing() {
  return (
    <main className="relative min-h-screen bg-black text-white">
      {/* Fondo: imagen de la Tierra */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/earth-hero.jpg')" }}
      />
      {/* Oscurecer para legibilidad */}
      <div className="absolute inset-0 -z-10 bg-black/55" />

      {/* Header fijo */}
      <Header />

      {/* Contenido central en 2 columnas */}
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pt-28 pb-16 md:grid-cols-2 md:pt-36">
        {/* Columna izquierda: texto y CTAs */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Humanity
          </h1>
          <p className="mt-4 text-lg text-zinc-300 max-w-xl">
            Your Own World
          </p>
    <HumanAvatar />

          <div className="mt-6 flex gap-4">
            <button className="px-5 py-3 rounded-lg bg-white text-black font-semibold">
              Get Started
            </button>
            <button className="px-5 py-3 rounded-lg border border-white/40">
              Learn More
            </button>
          </div>
        </div>

        {/* Columna derecha: avatar circular grande */}
        <div className="flex items-center justify-center md:justify-end">
          <div className="relative h-[360px] w-[360px] sm:h-[420px] sm:w-[420px]">
            <div className="absolute inset-0 rounded-full bg-white/15 blur-2xl" />
            <div className="relative rounded-full ring-2 ring-white/70 overflow-hidden shadow-2xl">
              {/* Tu componente de avatar */}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
