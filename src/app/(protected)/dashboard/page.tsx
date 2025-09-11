"use client";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user, ready, signOut } = useAuth();
  const router = useRouter();

  if (!ready) return <div className="p-6">Cargando…</div>;
  if (!user) { router.replace("/auth/sign-in"); return null; }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">My World</h1>
      <p className="mt-2">Bienvenido, {user.email}</p>
      <button className="mt-4 rounded border px-3 py-2" onClick={() => signOut().then(()=>router.push("/"))}>
        Cerrar sesión
      </button>
    </div>
  );
}
