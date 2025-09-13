'use client';

export default function AvatarAssistant() {
  return (
    <section className="mt-8 flex flex-col items-center gap-4">
      {/* Contenedor del avatar */}
      <div
        className="relative w-[320px] h-[320px] rounded-full p-[6px]
                   bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500
                   shadow-[0_0_40px_rgba(99,102,241,.35)] animate-[pulse_3s_ease-in-out_infinite]"
        aria-label="Asistente virtual"
      >
        <div className="rounded-full overflow-hidden bg-black w-full h-full ring-2 ring-white/10">
          {/* Si tienes un video corto del host, lo mostramos; si no, cae al poster */}
          <video
            className="w-full h-full object-cover"
            src="/avatars/host.webm"
            poster="/avatars/host.jpg"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </div>

      {/* Mensaje */}
      <div className="text-center">
        <p className="text-base text-zinc-200">¿Qué estás buscando hoy?</p>
        <p className="text-lg font-semibold text-white">
          Productos, Servicios o Conocimiento
        </p>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href="/explore"
          className="px-5 py-2 rounded-full bg-white text-black font-medium hover:opacity-90 transition"
        >
          Explorar & Comprar
        </a>
        <a
          href="/create-store"
          className="px-5 py-2 rounded-full bg-zinc-900/70 ring-1 ring-white/25 text-white hover:bg-zinc-800 transition"
        >
          Crear & Vender
        </a>
        <a
          href="/my-world"
          className="px-5 py-2 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition"
        >
          Mi Mundo
        </a>
      </div>
    </section>
  );
}
