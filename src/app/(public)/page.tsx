'use client';
<<<<<<< HEAD
import Link from "next/link";
import dynamic from "next/dynamic";

const Avatar3D = dynamic(() => import("@/components/Avatar3D"), { ssr: false });
// Si no tienes Earth como componente, puedes dejar solo el fondo de estrellas.
// Si existe "@/components/Earth", descomenta la línea siguiente y el uso más abajo.
// const Earth = dynamic(() => import("@/components/Earth"), { ssr: false });
=======
import Avatar3D from "@/components/Avatar3D";
>>>>>>> parent of 9f951ae (restore(landing): page.tsx from 0b35ca7)

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
<<<<<<< HEAD
      {/* Fondo: estrellas + (opcional) globo full-bleed detrás */}
      <div className="full-bleed z-behind">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
        {/* Descomenta si tienes Earth.tsx para que ocupe toda la pantalla detrás */}
        {/* <div className="absolute inset-0 pointer-events-none">
          <Earth />
        </div> */}
      </div>

      {/* Contenido centrado vertical, con padding responsivo */}
      <section className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2 md:gap-14 md:py-24 min-h-screen">
        {/* Columna izquierda: título + copy + CTAs */}
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
              Get Started
            </Link>
            <Link href="/about" className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">
=======
      <section className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-24 pt-28 md:grid-cols-2 md:gap-14 lg:pt-36">
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Humanity
          </h1>
          <p className="mt-2 text-2xl text-white/70">Your Own World</p>
          <p className="mt-5 max-w-xl text-white/80">
            A virtual reality e-commerce platform.
          </p>
          <div className="mt-8 flex gap-4">
            <a className="rounded-xl bg-white px-5 py-3 font-semibold text-black shadow hover:shadow-lg">
              My World
            </a>
            <a className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">
>>>>>>> parent of 9f951ae (restore(landing): page.tsx from 0b35ca7)
              Learn More
            </a>
          </div>
<<<<<<< HEAD
          <p className="mt-8 text-sm text-white/50">© 2025 Humanity — Your Own World</p>
        </div>

        {/* Columna derecha: Avatar 3D en tarjeta premium */}
        <div className="relative z-10">
          <div className="mx-auto aspect-[3/4] w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
            <Avatar3D className="h-[520px] w-full" />
            {/*
              Si ya tienes un modelo GLB, usa:
              <Avatar3D className="h-[520px] w-full" modelUrl="/avatars/assistant.glb" />
            */}
          </div>
=======
        </div>
        <div className="relative z-10">
          <Avatar3D className="mx-auto h-[480px] w-full max-w-md md:max-w-lg" />
>>>>>>> parent of 9f951ae (restore(landing): page.tsx from 0b35ca7)
        </div>
      </section>
    </main>
  );
}
