import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-4xl mx-auto pt-24">
        <h1 className="text-5xl font-bold tracking-tight">
          Build your own virtual world
        </h1>
        <p className="mt-3 text-slate-600 max-w-2xl">
          Create, explore and share immersive experiences. This is a safe preview: production is unchanged until we merge into <code>main</code>.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Link href="/create-shop" className="rounded-lg bg-slate-900 text-white px-4 py-2">
            Get started
          </Link>
          <Link href="/s/demo-shop" className="rounded-lg border px-4 py-2">
            View demo
          </Link>
        </div>
      </div>
    </main>
  );
}
