"use client";
import React from "react";
import { sendFramesToKiri } from "@/lib/kiri";

function fromDom(): string[] {
  const imgs = Array.from(document.querySelectorAll("img"))
    .map((el) => (el as HTMLImageElement).src)
    .filter(Boolean);
  // nos quedamos con dataURL/blob/_next/image típicas
  return imgs.filter(src =>
    src.startsWith("data:") || src.startsWith("blob:") || src.includes("/_next/image")
  );
}

function getFrames(): (Blob|File|string)[] {
  // 1) variable global
  // @ts-ignore
  if (typeof window !== "undefined" && window.__frames36 && window.__frames36.length) {
    // @ts-ignore
    return window.__frames36;
  }
  // 2) localStorage
  try {
    const raw = localStorage.getItem("spin36");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch {}
  // 3) scrape del DOM
  const domUrls = fromDom();
  if (domUrls.length) return domUrls.slice(0, 36);
  return [];
}

export default function KiriButton() {
  const [msg, setMsg] = React.useState<string>("");

  const onClick = async () => {
    const frames = getFrames();
    if (frames.length < 10) {
      setMsg("No encuentro los 36 frames. Genera los frames primero.");
      return;
    }
    try {
      setMsg(`Subiendo ${frames.length} imágenes a KIRI…`);
      const { serialize } = await sendFramesToKiri(frames);
      setMsg("¡Listo! Abriendo visor…");
      const viewer = `https://kiriengine.app/webapp/modelviews?type=0&pageNum=1&serialize=${encodeURIComponent(serialize)}`;
      window.open(viewer, "_blank");
      setMsg("");
    } catch (e:any) {
      setMsg("Error: " + (e?.message || e));
    }
  };

  return (
    <span style={{display:"inline-flex", gap:12, alignItems:"center"}}>
      <button onClick={onClick}
        style={{padding:"8px 12px",border:"1px solid #ddd",borderRadius:6,background:"#fff",cursor:"pointer"}}>
        Generate 3D (KIRI)
      </button>
      <small style={{color:"#666"}}>{msg}</small>
    </span>
  );
}
