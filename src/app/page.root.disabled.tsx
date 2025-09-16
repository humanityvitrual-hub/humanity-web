'use client';


export default function Landing() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl">
        {/* Texto lado izquierdo */}
        <div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight">
            Humanity
          </h1>
          <p className="mt-4 text-lg text-zinc-300 max-w-xl">
            Your Own World
          </p>
          <div className="mt-6 flex gap-4">
            <button className="px-5 py-3 rounded-lg bg-white text-black font-semibold">
              Get Started
            </button>
            <button className="px-5 py-3 rounded-lg border border-white/40">
              Learn More
            </button>
          </div>
        </div>

        {/* Avatar lado derecho */}
        <div className="flex justify-center">
        </div>
      </section>
    </main>
  );
}
