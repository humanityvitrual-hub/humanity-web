'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignIn() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/catalog/new';
  const [email, setEmail] = useState('');

  useEffect(() => {
    const has = localStorage.getItem('demo_session');
    if (has) router.replace(next);
  }, [router, next]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return alert('Ingresa un correo válido');
    localStorage.setItem('demo_session', JSON.stringify({ email, ts: Date.now() }));
    router.replace(next);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-md px-6 pt-28">
        <h1 className="text-3xl font-bold">Iniciar sesión (demo)</h1>
        <p className="mt-2 text-white/70">Solo para demo: guardamos sesión en tu navegador.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none"
          />
          <button className="w-full rounded-lg bg-white text-black font-semibold py-3">Entrar</button>
        </form>
        <p className="mt-4 text-sm text-white/60">¿Sin cuenta? Es demo: escribe tu correo y entra.</p>
      </section>
    </main>
  );
}
