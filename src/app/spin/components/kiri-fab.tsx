"use client";

import React, { useState } from "react";
import { createRoot } from "react-dom/client";

type KiriResp<T=any> = { code:number; msg:string; data?:T; ok?:boolean };
type UploadResp = { serialize?: string };

function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }

async function extract36FromVideo(video: HTMLVideoElement): Promise<Blob[]> {
  // Nos aseguramos de poder "seekear" el video
  if (video.readyState < 2) {
    await new Promise<void>(res => { video.onloadeddata = () => res(); });
  }
  const duration = video.duration || 12; // fallback
  const frames = 36;
  const step = duration / frames;

  const cvs = document.createElement("canvas");
  const ctx = cvs.getContext("2d")!;
  // tamaño: el del video (o un downscale suave)
  const w = video.videoWidth;
  const h = video.videoHeight;
  cvs.width = w;
  cvs.height = h;

  const out: Blob[] = [];

  for (let i=0;i<frames;i++){
    const t = Math.min(i*step, duration - 0.001);
    await new Promise<void>((res,reject)=>{
      const onSeeked = () => { video.removeEventListener("seeked", onSeeked); res(); };
      video.addEventListener("seeked", onSeeked, { once:true });
      try { video.currentTime = t; } catch(e){ video.removeEventListener("seeked", onSeeked); reject(e); }
    });
    ctx.drawImage(video, 0, 0, w, h);
    const blob: Blob = await new Promise(r=> cvs.toBlob(b=>r(b!), "image/jpeg", 0.92));
    out.push(blob);
  }
  return out;
}

async function uploadPhotos(blobs: Blob[], onProgress?: (i:number)=>void): Promise<string> {
  let serialize: string | undefined;

  for (let i=0;i<blobs.length;i++){
    const fd = new FormData();
    fd.append("image", blobs[i], `frame_${i+1}.jpg`);
    fd.append("photoNo", String(i+1));
    if (serialize) fd.append("serialize", serialize);
    // opcional: nombre del proyecto en la primera
    if (!serialize) fd.append("name", "spin_36");

    const r = await fetch("/api/kiri/photos", { method:"POST", body: fd });
    const j = await r.json() as KiriResp<UploadResp>;
    if (r.ok && (j.data?.serialize || j.data)) {
      // algunas versiones devuelven serialize en data o top-level
      serialize = (j.data?.serialize as string) || (j as any).serialize || serialize;
    } else {
      throw new Error(`Upload error (photo ${i+1}): ${j?.msg || j?.error || r.statusText}`);
    }
    onProgress?.(i+1);
    // Respiro leve para no saturar
    await sleep(80);
  }

  if (!serialize) throw new Error("No serialize returned from KIRI");
  return serialize;
}

async function waitReady(serialize: string, onTick?: (s:string)=>void): Promise<void> {
  // Poll hasta "success"
  for(;;){
    const r = await fetch(`/api/kiri/status?serialize=${encodeURIComponent(serialize)}`, { cache:"no-store" });
    const j = await r.json() as KiriResp<{ status:string }>;
    const st = j?.data?.status || (j as any)?.status;
    onTick?.(st || "unknown");
    if (st === "success") return;
    if (st && /fail|error/i.test(st)) throw new Error(`KIRI status: ${st}`);
    await sleep(1500);
  }
}

function injectKiriViewerRight(serialize: string) {
  // buscamos el contenedor derecho (donde ves los 36 frames)
  // tomamos el 2º .rounded-... o el segundo panel grande
  // más robusto: busca el primer <div> que contiene "1/36" u otro y reemplaza su contenido por un iframe
  // aquí: metemos un iframe fijo en body y lo posicionamos dentro del panel derecho.
  const panel = document.querySelector('[data-spin-preview-right]') as HTMLElement
            || document.querySelectorAll("main div")[1] as HTMLElement
            || document.body;

  const url = `https://kiriengine.app/webapp/modelviews?serialize=${encodeURIComponent(serialize)}&pageNum=1&type=0`;
  let host = document.getElementById("kiri-viewer-embed") as HTMLIFrameElement | null;
  if (!host) {
    host = document.createElement("iframe");
    host.id = "kiri-viewer-embed";
    host.style.width = "100%";
    host.style.height = "600px";
    host.style.border = "1px solid #ddd";
    host.style.borderRadius = "12px";
    host.style.boxShadow = "0 4px 14px rgba(0,0,0,.08)";
    panel.appendChild(host);
  }
  host.src = url;
}

function KiriFab() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sub, setSub] = useState<string | null>(null);

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

  async function gen3D() {
    try {
      setBusy(true);
      setMsg("Finding video…");
      const video = document.querySelector("video");
      if (!video) { setMsg("No video found on page"); return; }

      setMsg("Extracting 36 frames…");
      const blobs = await extract36FromVideo(video);

      let last = 0;
      setMsg(`Uploading photos 0/36…`);
      const serialize = await uploadPhotos(blobs, (i)=>{ last=i; setMsg(`Uploading photos ${i}/36…`); });

      setSub(serialize);
      setMsg("Processing on KIRI…");
      await waitReady(serialize, (s)=> setMsg(`KIRI status: ${s}`));

      setMsg("Opening viewer…");
      injectKiriViewerRight(serialize);
      setMsg("Done!");
      setTimeout(()=>setMsg(null), 3500);
    } catch (e:any) {
      setMsg(`Error: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
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
        title="Enviar 36 frames a KIRI"
      >
        Generate 3D
      </button>

      {sub && (
        <a
          href={`https://kiriengine.app/webapp/modelviews?serialize=${encodeURIComponent(sub)}`}
          target="_blank" rel="noreferrer"
          style={{ fontSize: 12, color: "#0aa", textDecoration: "underline", textAlign:"right" }}
        >
          Open in KIRI
        </a>
      )}

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
