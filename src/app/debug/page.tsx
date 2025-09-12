export default function Debug() {
  return (
    <main className="min-h-[100svh] grid place-items-center p-6">
      <div className="max-w-md w-full rounded-2xl bg-emerald-500 p-8 text-black shadow-xl">
        <h1 className="text-2xl font-semibold">Tailwind OK</h1>
        <p className="mt-2">
          Si ves esta tarjeta verde con bordes redondeados y sombra, Tailwind está funcionando.
        </p>
        <p className="mt-4 text-sm opacity-70">Luego volvemos al 3D.</p>
      </div>
    </main>
  );
}
