// src/app/spin/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type FitMode = "fit" | "crop";

export default function SpinVideoPage() {
  const N_FRAMES = 36;
  const TARGET_SIZE = 640;
  const SAFE = 0.92; // margen de seguridad para evitar tocar bordes

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [objUrl, setObjUrl] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [duration, setDuration] = useState(0);

  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);

  const [fitMode, setFitMode] = useState<FitMode>("fit"); // <<< evitar recortes

  useEffect(() => {
    return () => { if (objUrl) URL.revokeObjectURL(objUrl); };
  }, [objUrl]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      if (objUrl) URL.revokeObjectURL(objUrl);
      setFrames([]); setCurrent(0); setLoaded(false); setDuration(0);
      setObjUrl(URL.createObjectURL(f));
    } catch (err) {
      console.error(err); alert("Error al cargar el video.");
    }
  };

  const onLoadedMeta = () => {
    const v = videoRef.current; if (!v) return;
    setDuration(v.duration || 0); setLoaded(true);
    v.pause(); v.currentTime = 0;
  };

  const seekTo = (v: HTMLVideoElement, t: number) =>
    new Promise<void>((resolve) => {
      const onSeek = () => { v.removeEventListener("seeked", onSeek); resolve(); };
      v.addEventListener("seeked", onSeek, { once: true });
      v.currentTime = Math.min(Math.max(t, 0), v.duration || 0);
    });

  const extractFrames = useCallback(async () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !duration) return;

    try {
      try { v.muted = true; await v.play(); v.pause(); } catch {}
      const vw = v.videoWidth, vh = v.videoHeight;
      if (!vw || !vh) throw new Error("Video sin dimensiones válidas.");

      c.width = TARGET_SIZE; c.height = TARGET_SIZE;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("No hay contexto 2D.");

      setExtracting(true); setProgress(0);
      const urls: string[] = [];
      const dt = duration / N_FRAMES;

      for (let i = 0; i < N_FRAMES; i++) {
        await seekTo(v, i * dt);
        ctx.clearRect(0, 0, c.width, c.height);

        if (fitMode === "crop") {
          // Recorte cuadrado centrado (antes), con margen SAFE
          const side = Math.min(vw, vh) * SAFE;
          const sx = (vw - side) / 2;
          const sy = (vh - side) / 2;
          ctx.drawImage(v, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);
        } else {
          // FIT/LETTERBOX: no recorta; escala para que TODO quepa
          const scale = Math.min(TARGET_SIZE / vw, TARGET_SIZE / vh) * SAFE;
          const dw = vw * scale, dh = vh * scale;
          const dx = (TARGET_SIZE - dw) / 2;
          const dy = (TARGET_SIZE - dh) / 2;
          ctx.fillStyle = "#ffffff"; // fondo blanco (evita bordes negros)
          ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);
          ctx.drawImage(v, 0, 0, vw, vh, dx, dy, dw, dh);
        }

        urls.push(c.toDataURL("image/webp", 0.92));
        setProgress(Math.round(((i + 1) / N_FRAMES) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }

      setFrames(urls); setCurrent(0);
    } catch (err) {
      console.error(err); alert("Error generando frames. Intenta con video 8–12s.");
    } finally { setExtracting(false); }
  }, [duration, fitMode]);

  const onPointerDown = (ev: React.PointerEvent) => { if (!frames.length) return; setDragging(true); (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId); };
  const onPointerUp =   (ev: React.PointerEvent) => { setDragging(false); (ev.target as HTMLElement).releasePointerCapture?.(ev.pointerId); };
  const onPointerMove = (ev: React.PointerEvent) => {
    if (!dragging || !frames.length) return;
    const SENS = 6, delta = Math.trunc(ev.movementX / SENS);
    if (delta) setCurrent((i) => { let n = (i - delta) % frames.length; if (n < 0) n += frames.length; return n; });
  };

  const canExtract = useMemo(() => loaded && !!objUrl && !extracting, [loaded, objUrl, extracting]);

  const clearVideo = () => {
    if (objUrl) URL.revokeObjectURL(objUrl);
    setObjUrl(""); setFrames([]); setLoaded(false); setDuration(0); setProgress(0); setCurrent(0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-6xl mx-auto pt-10">
        <h1 className="text-3xl md:text-4xl font-bold">Create a 360 product from a video</h1>
        <p className="mt-2 text-slate-600">
          Upload a short spin video (8–12s). We extract <b>36 frames</b> in the browser and build a 360° viewer.
          This is <b>Preview-only</b>; no backend uploads.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center px-4 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow cursor-pointer">
            <input type="file" accept="video/*" onChange={onPickFile} className="sr-only" />
            <span>Choose spin video</span>
          </label>

          {objUrl && (
            <>
              <button
                disabled={!canExtract}
                onClick={extractFrames}
                className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition disabled:opacity-50 text-sm"
                title={canExtract ? "Extract 36 frames" : ""}
              >
                {extracting ? "Extracting…" : "Generate 36 frames"}
              </button>

              <button onClick={clearVideo} className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition text-sm">
                Reset
              </button>

              {/* Toggle FIT/CROP */}
              <div className="inline-flex items-center gap-1 text-sm ml-2">
                <span className="text-slate-600">Framing:</span>
                <button
                  onClick={() => setFitMode("fit")}
                  className={`px-2 py-1 rounded border ${fitMode==="fit" ? "bg-slate-900 text-white" : "bg-white/70"}`}
                  title="No recorta (letterbox)"
                >FIT</button>
                <button
                  onClick={() => setFitMode("crop")}
                  className={`px-2 py-1 rounded border ${fitMode==="crop" ? "bg-slate-900 text-white" : "bg-white/70"}`}
                  title="Recorte centrado (puede cortar bordes)"
                >CROP</button>
            </div>
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
                playsInline muted controls onLoadedMetadata={onLoadedMeta}
              />
            )}

            {extracting && (
              <div className="mt-3">
                <div className="h-2 bg-slate-200 rounded">
                  <div className="h-2 bg-slate-800 rounded transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs mt-2 text-slate-500">Extracting frames… {progress}%</p>
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
                onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerMove={onPointerMove}
              >
                <img src={frames[current]} alt={`frame ${current + 1}/${frames.length}`} className="w-full h-full object-contain" draggable={false} />
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
