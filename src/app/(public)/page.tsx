'use client';
import Avatar3D from "@/components/Avatar3D";

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
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
              Learn More
            </a>
          </div>
        </div>
        <div className="relative z-10">
          <Avatar3D className="mx-auto h-[480px] w-full max-w-md md:max-w-lg" />
        </div>
      </section>
    </main>
  );
}
