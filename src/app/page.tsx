export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-3xl mx-auto pt-24">
        <h1 className="text-4xl font-bold tracking-tight">Hola 👋</h1>
        <p className="mt-2 text-slate-600">
          Next.js 15 + Tailwind funcionando (prueba visual).
        </p>

        <div className="mt-8 rounded-xl border bg-white/70 backdrop-blur p-6 shadow">
          <p>
            Si ves <span className="font-semibold">degradado</span> de fondo,{' '}
            <span className="font-semibold">tarjeta con borde</span> y{' '}
            <span className="font-semibold">sombra</span>, Tailwind está OK.
          </p>
          <button className="mt-4 rounded-lg border px-4 py-2 shadow-sm hover:shadow transition">
            Botón de prueba
          </button>
        </div>
      </div>
    </main>
  );
}
