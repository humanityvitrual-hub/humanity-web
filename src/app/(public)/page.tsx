import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />

      {/* Fondo decorativo */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_10%,rgba(59,130,246,.25),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <main className="mx-auto max-w-6xl px-4 pt-36 pb-16">
        <section className="text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
            Your Own World
          </h1>
          <p className="mt-5 text-lg sm:text-xl opacity-80 max-w-2xl mx-auto">
            Crea y explora tu propio mundo digital. Construimos la base para experiencias
            personalizadas y escalables.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/my-world" className="px-6 py-3 rounded bg-white text-black font-medium">
              Enter My World
            </a>
            <a href="/about" className="px-6 py-3 rounded border border-white/20 hover:bg-white/10">
              Learn More
            </a>
          </div>

          {/* Highlights */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm opacity-80">
            <div className="rounded-lg border border-white/10 p-4">Tiendas 3D personalizadas</div>
            <div className="rounded-lg border border-white/10 p-4">Entornos 360° y VR</div>
            <div className="rounded-lg border border-white/10 p-4">Pagos (Stripe, test)</div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
