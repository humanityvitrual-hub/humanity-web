'use client';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';

const EarthClient = dynamic(() => import('@/components/EarthClient'), { ssr: false });

export default function Landing() {
  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Fondo 3D: Tierra */}
      <div className="pointer-events-none absolute inset-0">
        <EarthClient />
        {/* Oscurecido para contraste del texto */}
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Header */}
      <Header />

      {/* Contenido */}
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pt-28 pb-16 md:grid-cols-2 md:pt-36">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Explore the World in 3D
          </h1>
          <p className="mt-4 text-lg text-zinc-300 max-w-xl">
            A virtual reality e-commerce platform.
          </p>

          <div className="mt-6 flex gap-4">
            <a className="px-5 py-3 rounded-lg bg-white text-black font-semibold" href="/shop">Get Started</a>
            <a className="px-5 py-3 rounded-lg border border-white/40" href="/about">Learn More</a>
          </div>
        </div>

        {/* Columna derecha vacía (la Tierra queda de fondo) */}
        <div className="hidden md:block" />
      </section>
    </main>
  );
}
