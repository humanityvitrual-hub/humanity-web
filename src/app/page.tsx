export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Header mínimo */}
      <header className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Humanity</div>
        </div>
      </header>

      {/* HERO visible (cambio claro) */}
      <section className="mx-auto max-w-3xl px-6 pt-10 pb-12">
        <h1 className="text-5xl font-bold tracking-tight">
          Construye tu propio mundo virtual
        </h1>
        <p className="mt-4 text-slate-600">
          Crea, explora y comparte experiencias inmersivas. Este es un preview seguro:
          no afecta producción hasta que se haga merge a <code>main</code>.
        </p>

        <div className="mt-8 flex gap-4">
          <a
            href="#"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-white hover:opacity-90 transition"
          >
            Empezar
          </a>
          <a
            href="#"
            className="rounded-lg border px-5 py-2.5 hover:shadow-sm transition"
          >
            Ver demo
          </a>
        </div>
      </section>

      {/* Dejo la tarjeta de prueba abajo, por si quieres seguir validando Tailwind */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="rounded-xl border bg-white/70 backdrop-blur p-6 shadow">
          <p>
            Si ves <span className="font-semibold">degradado</span> de fondo,{' '}
            <span className="font-semibold">tarjeta con borde</span> y{' '}
            <span className="font-semibold">sombra</span>, Tailwind está OK.
          </p>
          <button className="mt-4 rounded-lg border px-4 py-2 shadow-sm hover:shadow transition">
            Botón de prueba
          </button>
        </div>
      </section>
    </main>
  );
}
