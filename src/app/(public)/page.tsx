'use client';
import Header from '@/components/Header';

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Fondo: imagen de la Tierra */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/earth-hero.jpg')" }}
      />
      {/* Oscurecido para legibilidad */}
      <div className="absolute inset-0 z-0 bg-black/55" />

      {/* Header fijo */}
      <Header />

      {/* Contenido central */}
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

        {/* Columna derecha vacía: la Tierra queda de fondo */}
        <div className="hidden md:block" />
      </section>
    </main>
  );
}
