'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Mock sign-up: ${email}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Sign Up</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full px-3 py-2 rounded bg-white/10 border border-white/20"
            placeholder="Email" type="email" value={email}
            onChange={e=>setEmail(e.target.value)} required
          />
          <input
            className="w-full px-3 py-2 rounded bg-white/10 border border-white/20"
            placeholder="Password" type="password" value={pwd}
            onChange={e=>setPwd(e.target.value)} required
          />
          <button className="w-full px-3 py-2 rounded bg-white text-black font-medium">
            Create account
          </button>
        </form>
      </div>
    </main>
  );
}
