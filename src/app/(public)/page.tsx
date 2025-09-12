'use client';
import Link from "next/link";

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Fondo de estrellas sutil */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />

      {/* Contenedor */}
      <section className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-24 pt-24 md:grid-cols-2 md:gap-14 lg:pt-32">

        {/* Columna izquierda: branding + copy + CTAs */}
        <div className="relative z-10">
          <div className="mb-6 text-sm tracking-widest text-white/70">HUMANITY</div>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Explore the World <br className="hidden md:block" /> in 3D
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/80">
            A virtual reality e-commerce platform.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/my-world" className="rounded-xl bg-white px-5 py-3 font-semibold text-black shadow hover:shadow-lg">
              My World
            </Link>
            <Link href="/about" className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">
              Learn More
            </Link>
          </div>

          <p className="mt-8 text-sm text-white/50">© 2025 Humanity — Your Own World</p>
        </div>

        {/* Columna derecha: placeholder (aquí irá el Avatar3D luego) */}
        <div className="relative z-10">
          <div className="mx-auto aspect-[3/4] w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl" />
        </div>

        {/* Disco del planeta detrás (tu Earth 3D/imagen puede ir en otro componente o background) */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-12%] top-10 hidden aspect-square w-[820px] rounded-full bg-[#0e2131] opacity-60 blur-[1px] md:block"
        />
      </section>
    </main>
  );
}
