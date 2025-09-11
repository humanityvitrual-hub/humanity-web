"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/ui/Button";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (pwd.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
      await createUserWithEmailAndPassword(auth, email, pwd);
      router.push("/my-world");
    } catch (err: any) {
      alert(err?.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>
        <p className="mt-2 text-neutral-400">Regístrate con email y contraseña.</p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Email</span>
            <input
              className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
              type="email" required autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Contraseña</span>
            <input
              className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
              type="password" required autoComplete="new-password"
              value={pwd} onChange={(e) => setPwd(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <Button type="submit" disabled={loading}>
            {loading ? "Creando..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-neutral-400">
          ¿Ya tienes cuenta?{" "}
          <Link className="underline" href="/auth/sign-in">Inicia sesión</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
