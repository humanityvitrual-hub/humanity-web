"use client";

import React, { useState } from "react";
import { createRoot } from "react-dom/client";

function KiriFab() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function checkBalance() {
    try {
      setBusy(true);
      setMsg("Checking credits…");
      const r = await fetch("/api/kiri/balance", { cache: "no-store" });
      const j = await r.json();
      if (r.ok && j?.data?.balance != null) {
        setMsg(`KIRI credits: ${j.data.balance}`);
      } else {
        setMsg(`Error: ${j?.error || j?.msg || r.status}`);
      }
    } catch (e:any) {
      setMsg(`Error: ${e?.message || e}`);
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  function gen3D() {
    // placeholder: cuando conectemos los 36 frames, aquí haremos el upload a /api/kiri/photos
    setMsg("Generate 3D (WIP): subiremos los 36 frames a KIRI desde aquí.");
    setTimeout(() => setMsg(null), 2500);
  }

  return (
    <div style={{
      position: "fixed", right: 16, bottom: 16, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8
    }}>
      <button
        onClick={checkBalance}
        disabled={busy}
        style={{
          padding: "10px 14px", borderRadius: 10, border: "1px solid #0aa",
          background: "#0ff", color: "#033", fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,0,0,.15)"
        }}
        title="Consultar créditos KIRI"
      >
        {busy ? "…" : "KIRI • Check credits"}
      </button>

      <button
        onClick={gen3D}
        disabled={busy}
        style={{
          padding: "10px 14px", borderRadius: 10, border: "1px solid #444",
          background: "#fff", color: "#111", fontWeight: 600, cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,0,0,.15)"
        }}
        title="Enviar 36 frames a KIRI (WIP)"
      >
        Generate 3D (WIP)
      </button>

      {msg && (
        <div style={{
          padding: "8px 12px", borderRadius: 8, background: "#111",
          color: "#0ff", fontSize: 12, maxWidth: 260
        }}>{msg}</div>
      )}
    </div>
  );
}

/** Auto-montaje al importar este archivo */
(function mount() {
  if (typeof window === "undefined") return;
  const id = "kiri-fab-container";
  if (document.getElementById(id)) return;
  const el = document.createElement("div");
  el.id = id;
  document.body.appendChild(el);
  const root = createRoot(el);
  root.render(<KiriFab />);
})();
