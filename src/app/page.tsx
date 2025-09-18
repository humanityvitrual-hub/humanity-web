export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Humanity</div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-10 pb-12">
        <h1 className="text-5xl font-bold tracking-tight">
          Build your own virtual world
        </h1>
        <p className="mt-4 text-slate-600">
          Create, explore and share immersive experiences. This is a safe preview:
          production is unchanged until we merge into <code>main</code>.
        </p>

        <div className="mt-8 flex gap-4">
          <a
            href="#"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-white hover:opacity-90 transition"
          >
            Get started
          </a>
          <a
            href="#"
            className="rounded-lg border px-5 py-2.5 hover:shadow-sm transition"
          >
            View demo
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="rounded-xl border bg-white/70 backdrop-blur p-6 shadow">
          <p>
            If you can see a <span className="font-semibold">background gradient</span>, a{' '}
            <span className="font-semibold">card with border</span> and{' '}
            <span className="font-semibold">shadow</span>, Tailwind is working.
          </p>
          <button className="mt-4 rounded-lg border px-4 py-2 shadow-sm hover:shadow transition">
            Test button
          </button>
        </div>
      </section>
    </main>
  );
}
