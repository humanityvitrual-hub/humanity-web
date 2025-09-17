export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto py-24 px-6">
        <h1 className="text-4xl font-extrabold tracking-tight">Hola 👋</h1>
        <p className="mt-4 text-lg text-slate-700">
          Next.js 15 + Tailwind funcionando (prueba visual).
        </p>

        <div className="mt-10 rounded-2xl border border-slate-300 bg-white/70 p-6 shadow">
          <p className="text-slate-800">
            Si ves <span className="font-semibold">degradado</span> de fondo,
            <span className="font-semibold"> tarjeta con borde</span> y
            <span className="font-semibold"> sombra</span>, Tailwind está OK.
          </p>
          <button className="mt-6 inline-flex items-center rounded-xl border px-4 py-2 shadow hover:shadow-lg">
            Botón de prueba
          </button>
        </div>
      </div>
    </main>
  );
}
