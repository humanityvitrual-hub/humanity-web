'use client';
// Mock auth temporal para publicar YA (sin Firebase)
import { useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<null | { email: string }>(null);
  const signIn = async (email: string) => { setUser({ email }); return { ok: true }; };
  const signOut = async () => { setUser(null); return { ok: true }; };
  return { user, signIn, signOut };
}
