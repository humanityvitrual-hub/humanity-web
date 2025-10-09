"use client";

import { useState } from "react";

type FrameSrc = string | Blob | File;

async function toFile(src: FrameSrc, name: string, typeHint = "image/jpeg"): Promise<File> {
  if (src instanceof File) return src;
  if (src instanceof Blob) return new File([src], name, { type: src.type || typeHint, lastModified: Date.now() });

  // Si es string (dataURL o blob/object URL), úsalo con fetch para obtener bytes reales
  const res = await fetch(src);
  if (!res.ok) throw new Error(`fetch frame failed: ${res.status}`);
  const blob = await res.blob();
  if (blob.size === 0) throw new Error("frame blob is empty after fetch()");
  return new File([blob], name, { type: blob.type || typeHint, lastModified: Date.now() });
}

async function postPhoto(photoNo: number, file: File, serialize: string, name?: string) {
  const fd = new FormData();
  fd.append("image", file, file.name || `photo_${photoNo}.jpg`);
  fd.append("photoNo", String(photoNo));
  fd.append("serialize", serialize);
  if (name) fd.append("name", name);

  const r = await fetch("/api/kiri/photos", { method: "POST", body: fd });
  const t = await r.text();
  let json: any;
  try { json = JSON.parse(t); } catch { json = { raw: t }; }
  if (!r.ok) {
    const msg = (json && (json.error || json.msg)) || `HTTP ${r.status}`;
    throw new Error(msg);
  }
  return json;
}

async function getBalance(): Promise<number> {
  const r = await fetch("/api/kiri/balance", { cache: "no-store" });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error || "balance failed");
  // formatos posibles: {code:200,data:{balance:20}} o {ok:true,balance}
  if (typeof j?.data?.balance === "number") return j.data.balance;
  if (typeof j?.balance === "number") return j.balance;
  return 0;
}

/**
 * Este componente acepta `frames` directamente o, si no vienen,
 * intentará usar `getFrames()` si la página lo provee.
 */
export default function KiriButton(props: {
  frames?: FrameSrc[];
  getFrames?: () => FrameSrc[];
}) {
  const [credits, setCredits] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const frames: FrameSrc[] = props.frames ?? (props.getFrames ? props.getFrames() : []);

  async function handleCheckCredits() {
    try {
      const c = await getBalance();
      setCredits(c);
      setToast(null);
    } catch (e: any) {
      setToast(`Error: ${String(e?.message || e)}`);
    }
  }

  async function handleGenerate3D() {
    setToast(null);
    if (!frames || frames.length === 0) {
      setToast("Primero genera los 36 frames.");
      return;
    }
    setBusy(true);
    try {
      // 1) abre un proyecto nuevo (modelo) en KIRI (subiendo la 1ª foto con serialize vacío)
      const serialize = crypto.randomUUID(); // usamos nuestro id y lo pasamos a cada upload
      // Sube todas las fotos en orden 1..N
      for (let i = 0; i < frames.length; i++) {
        const photoNo = i + 1;
        const file = await toFile(frames[i], `frame_${photoNo}.jpg`);
        if (file.size === 0) throw new Error(`Zero-byte before upload (photo ${photoNo})`);
        await postPhoto(photoNo, file, serialize, `Frame ${photoNo}`);
      }
      setToast("Frames subidos a KIRI. (WIP: polling de estado no incluido aún)");
    } catch (e: any) {
      setToast(`Error: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      position: "fixed",
      right: 16,
      bottom: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      alignItems: "flex-end",
      zIndex: 50
    }}>
      <button
        onClick={handleCheckCredits}
        disabled={busy}
        style={{
          background: "#00e0d8", color: "#042", border: "none",
          padding: "12px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer", minWidth: 240
        }}
      >
        KIRI • Check credits{credits !== null ? `: ${credits}` : ""}
      </button>

      <button
        onClick={handleGenerate3D}
        disabled={busy}
        style={{
          background: busy ? "#999" : "#111", color: "#fff", border: "none",
          padding: "12px 16px", borderRadius: 10, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", minWidth: 240
        }}
      >
        {busy ? "Uploading…" : "Generate 3D"}
      </button>

      {toast && (
        <div style={{
          maxWidth: 360, background: "#111", color: "#ffe",
          padding: "10px 12px", borderRadius: 8, fontSize: 13, opacity: 0.95
        }}>{toast}</div>
      )}
    </div>
  );
}
