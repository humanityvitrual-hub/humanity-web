'use client';

import AvatarHuman from '@/components/AvatarHuman';
import StarsBG from '@/components/StarsBG';

export default function AvatarDebugPage() {
  return (
    <main className="relative min-h-[100svh] bg-black text-white overflow-hidden">
      <StarsBG />
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-12 gap-8 items-center">
          <div className="col-span-12 lg:col-span-7">
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight">
              Avatar Debug
            </h1>
            <p className="mt-4 text-lg text-zinc-300 max-w-xl">
              Deberías ver el panel del avatar a la derecha.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <div className="border border-white/20 rounded-2xl p-2">
              <AvatarHuman className="mx-auto max-w-md" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
