"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BG_API = process.env.NEXT_PUBLIC_BG_API || ""; // <- viene de Vercel

export default function SpinVideoPage() {
  const N_FRAMES = 36;
  const TARGET_SIZE = 640;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [objUrl, setObjUrl] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [duration, setDuration] = useState(0);

  const [extracting, setExtracting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [frames, setFrames] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Limpieza del ObjectURL
  useEffect(() => () => { if (objUrl) URL.revokeObjectURL(objUrl); }, [objUrl]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      if (objUrl) URL.revokeObjectURL(objUrl);
      setFrames([]); setCurrent(0); setLoaded(false); setDuration(0);
      const url = URL.createObjectURL(f);
      setObjUrl(url);
    } catch (err) {
      console.error(err);
      alert("Error al cargar el video.");
    }
  };

  const onLoadedMeta = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
    setLoaded(true);
    v.pause();
    v.currentTime = 0;
  };

  // seek confiable
  const seekTo = (v: HTMLVideoElement, t: number) =>
    new Promise<void>((resolve) => {
      const onSeek = () => { v.removeEventListener("seeked", onSeek); resolve(); };
      v.addEventListener("seeked", onSeek, { once: true });
      v.currentTime = Math.min(Math.max(t, 0), v.duration || 0);
    });

  // Letterbox (evita cortar cabeza/pies)
  function drawLetterboxed(
    ctx: CanvasRenderingContext2D,
    source: CanvasImageSource,
    sw: number, sh: number,
    dw: number, dh: number
  ) {
    const s = Math.min(dw / sw, dh / sh);
    const w = Math.round(sw * s);
    const h = Math.round(sh * s);
    const dx = Math.floor((dw - w) / 2);
    const dy = Math.floor((dh - h) / 2);
    ctx.clearRect(0, 0, dw, dh);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, dw, dh);
    ctx.drawImage(source, 0, 0, sw, sh, dx, dy, w, h);
  }

  const extractFrames = useCallback(async (nFrames = N_FRAMES) => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !duration) return;

    try {
      try { v.muted = true; await v.play(); v.pause(); } catch {}
      const vw = v.videoWidth, vh = v.videoHeight;
      if (!vw || !vh) throw new Error("El video no tiene dimensiones válidas.");

      c.width = TARGET_SIZE; c.height = TARGET_SIZE;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas.");

      setExtracting(true);
      setStatus("Extracting frames…");
      setProgress(0);

      const urls: string[] = [];
      const dt = duration / nFrames;

      for (let i = 0; i < nFrames; i++) {
        await seekTo(v, i * dt);
        drawLetterboxed(ctx, v, vw, vh, TARGET_SIZE, TARGET_SIZE);
        const dataUrl = c.toDataURL("image/webp", 0.92);
        urls.push(dataUrl);
        setProgress(Math.round(((i + 1) / nFrames) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }

      setFrames(urls);
      setCurrent(0);
    } catch (err) {
      console.error(err);
      alert("Error generando frames. Reintenta con un video 8–12s.");
    } finally {
      setExtracting(false);
      setStatus("");
    }
  }, [duration]);

  // Utils
  function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = url;
    });
  }

  // BBox por alfa
  function bboxAlpha(img: HTMLImageElement) {
    const t = document.createElement("canvas");
    t.width = img.width; t.height = img.height;
    const tx = t.getContext("2d", { willReadFrequently: true })!;
    tx.clearRect(0,0,t.width,t.height);
    tx.drawImage(img,0,0);
    const data = tx.getImageData(0,0,t.width,t.height).data;
    let minX = t.width, minY = t.height, maxX = -1, maxY = -1;
    for (let y=0; y<t.height; y++) {
      for (let x=0; x<t.width; x++) {
        const a = data[(y*t.width + x)*4 + 3];
        if (a > 10) { // umbral
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0 || maxY < 0) return {x:0,y:0,w:img.width,h:img.height};
    return {x:minX, y:minY, w:maxX-minX+1, h:maxY-minY+1};
  }

  // Normaliza: misma escala + centro
  async function normalizeFrames(pngs: string[]): Promise<string[]> {
    setStatus("Normalizing…");
    setProgress(0);
    const imgs: HTMLImageElement[] = [];
    for (let i=0;i<pngs.length;i++) {
      imgs.push(await loadImage(pngs[i]));
    }
    // bboxes + mayor dimensión
    const bboxes = imgs.map(bboxAlpha);
    const maxDim = Math.max(...bboxes.map(b => Math.max(b.w, b.h)));
    const SCALE = (TARGET_SIZE * 0.86) / maxDim; // margen
    const out: string[] = [];
    const c = document.createElement("canvas");
    c.width = TARGET_SIZE; c.height = TARGET_SIZE;
    const cx = c.getContext("2d", { willReadFrequently: true })!;
    for (let i=0;i<imgs.length;i++) {
      const im = imgs[i]; const b = bboxes[i];
      const dw = Math.round(b.w * SCALE);
      const dh = Math.round(b.h * SCALE);
      const dx = Math.floor((TARGET_SIZE - dw) / 2);
      const dy = Math.floor((TARGET_SIZE - dh) / 2);
      cx.clearRect(0,0,c.width,c.height);
      // Fondo blanco para preview limpio (puedes quitar si quieres transparencia)
      cx.fillStyle = "#fff"; cx.fillRect(0,0,c.width,c.height);
      cx.drawImage(im, b.x, b.y, b.w, b.h, dx, dy, dw, dh);
      out.push(c.toDataURL("image/webp", 0.95));
      setProgress(Math.round(((i+1)/imgs.length)*100));
      await new Promise(r=>setTimeout(r,0));
    }
    setStatus("");
    return out;
  }

  // Llamada al backend (Render) en lotes
  const removeBgServer = useCallback(async () => {
    if (!frames.length) return;
    if (!BG_API) { alert("Falta configurar NEXT_PUBLIC_BG_API"); return; }

    try {
      setProcessing(true);
      setStatus("Uploading frames…");
      setProgress(0);

      const BATCH = 6; // payload moderado
      const outPngs: string[] = [];
      for (let i=0; i<frames.length; i+=BATCH) {
        const slice = frames.slice(i, i+BATCH);
        const res = await fetch(`${BG_API}/remove_bg`, {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ frames: slice }),
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Server error: ${res.status} ${t}`);
        }
        const json = await res.json();
        if (!json.ok || !Array.isArray(json.frames)) {
          throw new Error("Bad server response");
        }
        outPngs.push(...json.frames);
        setProgress(Math.round(((i + slice.length) / frames.length) * 100));
        await new Promise(r=>setTimeout(r,0));
      }

      // Normalización (centra/escala consistente)
      const normalized = await normalizeFrames(outPngs);
      setFrames(normalized);
      setCurrent(0);
    } catch (e:any) {
      console.error(e);
      alert(e?.message || "Remove-bg (server) failed.");
    } finally {
      setProcessing(false);
      setStatus("");
      setProgress(0);
    }
  }, [frames]);

  // Visor 360
  const onPointerDown = (ev: React.PointerEvent) => {
    if (!frames.length) return;
    setDragging(true);
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
  };
  const onPointerUp = (ev: React.PointerEvent) => {
    setDragging(false);
    (ev.target as HTMLElement).releasePointerCapture?.(ev.pointerId);
  };
  const onPointerMove = (ev: React.PointerEvent) => {
    if (!dragging || !frames.length) return;
    const SENS = 6;
    const delta = Math.trunc(ev.movementX / SENS);
    if (delta !== 0) {
      setCurrent((i) => {
        let n = (i - delta) % frames.length;
        if (n < 0) n += frames.length;
        return n;
      });
    }
  };

  const canExtract = useMemo(() => loaded && !!objUrl && !extracting, [loaded, objUrl, extracting]);

  const clearVideo = () => {
    if (objUrl) URL.revokeObjectURL(objUrl);
    setObjUrl("");
    setFrames([]);
    setLoaded(false);
    setDuration(0);
    setProgress(0);
    setStatus("");
    setCurrent(0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-6xl mx-auto pt-10">
        <h1 className="text-3xl md:text-4xl font-bold">Create a 360 product from a video</h1>
        <p className="mt-2 text-slate-600">
          Upload a short spin video (8–12s). We extract <b>{N_FRAMES} frames</b> in the browser and build a 360° viewer.
          This is <b>Preview-only</b>; no backend uploads (except optional server remove-bg).
        </p>

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center px-4 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow cursor-pointer">
            <input type="file" accept="video/*;capture=environment" onChange={onPickFile} className="sr-only" />
            <span>Choose spin video</span>
          </label>

          {objUrl && (
            <>
              <button
                disabled={!canExtract}
                onClick={() => extractFrames(N_FRAMES)}
                className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition disabled:opacity-50 text-sm"
              >
                {extracting ? "Extracting…" : `Generate ${N_FRAMES} frames (local)`}
              </button>

              <button
                disabled={!frames.length || processing}
                onClick={removeBgServer}
                className="px-3 py-2 rounded-lg border bg-indigo-600 text-white shadow-sm hover:shadow transition disabled:opacity-50 text-sm"
                title={BG_API ? `Server: ${new URL(BG_API).host}` : "Configure NEXT_PUBLIC_BG_API"}
              >
                {processing ? (status ? `${status} ${progress}%` : "Processing…") : "Remove background (server)"}
              </button>

              <button
                onClick={clearVideo}
                className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition text-sm"
              >
                Reset
              </button>

              {loaded ? (
                <span className="text-emerald-600 text-sm">Video ready</span>
              ) : objUrl ? (
                <span className="text-slate-500 text-sm">Loading metadata…</span>
              ) : null}

              {!BG_API && (
                <span className="text-amber-600 text-sm ml-2">Server URL not set</span>
              )}
            </>
          )}
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-white/70 p-3 shadow">
            {!objUrl ? (
              <div className="aspect-video grid place-items-center text-slate-500">
                <p>Pick a <strong>video</strong> to start.</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={objUrl}
                className="w-full max-h-[70vh] rounded-lg"
                playsInline
                muted
                controls
                onLoadedMetadata={onLoadedMeta}
              />
            )}

            {(extracting || processing) && (
              <div className="mt-3">
                <div className="h-2 bg-slate-200 rounded">
                  <div className="h-2 bg-slate-800 rounded transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs mt-2 text-slate-500">
                  {status || "Working…"} {progress}%
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white/70 p-3 shadow">
            {!frames.length ? (
              <div className="aspect-square grid place-items-center text-slate-500">
                <p>When frames are ready, drag to rotate.</p>
              </div>
            ) : (
              <div
                className="aspect-square relative select-none rounded-lg overflow-hidden bg-white"
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerMove={onPointerMove}
              >
                <img
                  src={frames[current]}
                  alt={`frame ${current + 1}/${frames.length}`}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
                <div className="absolute bottom-2 right-3 text-[11px] text-slate-500 bg-white/70 rounded px-2 py-[2px]">
                  {current + 1}/{frames.length}
                </div>
              </div>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}
