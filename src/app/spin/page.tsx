"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * /spin estabilizado (client-only)
 * - Extrae N frames
 * - Auto-centrado mediante "centro de masa" de bordes
 * - Suavizado de centro/escala (EMA)
 * - Normalización ligera de exposición
 * - Visor 360 con drag
 */
export default function SpinVideoPage() {
  const N_FRAMES = 36;
  const TARGET_SIZE = 640; // px (cuadrado)

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const workCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [objUrl, setObjUrl] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);

  // limpiar URLs cuando cambie video/frames
  useEffect(() => {
    return () => {
      if (objUrl) URL.revokeObjectURL(objUrl);
      frames.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [objUrl, frames]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    frames.forEach((u) => URL.revokeObjectURL(u));
    setFrames([]);
    setCurrent(0);
    const url = URL.createObjectURL(f);
    setObjUrl(url);
    setLoaded(false);
  };

  const onLoadedMeta = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
    setLoaded(true);
    v.pause();
    v.currentTime = 0;
  };

  const seekTo = (v: HTMLVideoElement, t: number) =>
    new Promise<void>((resolve) => {
      const onSeek = () => {
        v.removeEventListener("seeked", onSeek);
        resolve();
      };
      v.addEventListener("seeked", onSeek, { once: true });
      v.currentTime = Math.min(Math.max(t, 0), v.duration || 0);
    });

  // --- helpers de imagen (sin OpenCV) --------------------------------------
  function sobelCenterOfMass(img: ImageData) {
    // Gradiente aproximado (Sobel 3x3) + centro de masa por magnitud
    const { data, width, height } = img;
    // Trabajamos en escala de grises ligera
    const gray = new Uint8ClampedArray(width * height);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      // luma aproximada
      gray[j] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    }
    const GxK = [-1,0,1,-2,0,2,-1,0,1];
    const GyK = [-1,-2,-1,0,0,0,1,2,1];
    let sumMag = 0, sumX = 0, sumY = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0, k = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            const v = gray[idx];
            gx += v * GxK[k];
            gy += v * GyK[k];
            k++;
          }
        }
        const mag = Math.hypot(gx, gy);
        // threshold suave para evitar ruido
        if (mag > 40) {
          sumMag += mag;
          sumX += x * mag;
          sumY += y * mag;
        }
      }
    }
    if (sumMag < 1e-3) {
      return { cx: width / 2, cy: height / 2, radius: Math.min(width, height) / 3 };
    }
    // radio aproximado según densidad de bordes
    const radius = Math.max(40, Math.min(width, height) * 0.35);
    return { cx: sumX / sumMag, cy: sumY / sumMag, radius };
  }

  function histogramNormalize(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.2) {
    // Normalización muy ligera (mezcla hacia equalize)
    const img = ctx.getImageData(0, 0, w, h);
    const { data } = img;
    const hist = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const y = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000 | 0;
      hist[y]++;
    }
    // CDF
    const cdf = new Array(256).fill(0);
    let acc = 0;
    for (let i = 0; i < 256; i++) { acc += hist[i]; cdf[i] = acc; }
    const total = w * h;
    for (let i = 0; i < data.length; i += 4) {
      const y = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000 | 0;
      const eq = Math.round((cdf[y] / total) * 255);
      // mezcla parcial para no sobre-corregir
      const mix = (a: number, b: number) => Math.round(a * (1 - strength) + b * strength);
      const ratio = eq / (y || 1);
      data[i]   = mix(data[i],   Math.min(255, data[i]   * ratio));
      data[i+1] = mix(data[i+1], Math.min(255, data[i+1] * ratio));
      data[i+2] = mix(data[i+2], Math.min(255, data[i+2] * ratio));
    }
    ctx.putImageData(img, 0, 0);
  }

  const extractFrames = useCallback(async () => {
    const v = videoRef.current;
    const work = workCanvasRef.current;   // canvas con resolución nativa del video
    const draw = drawCanvasRef.current;   // canvas destino cuadrado TARGET_SIZE
    if (!v || !work || !draw || !duration) return;

    // desbloquear iOS
    try { v.muted = true; await v.play(); v.pause(); } catch {}

    const vw = v.videoWidth, vh = v.videoHeight;
    if (!vw || !vh) return;

    // canvas de trabajo (reducido para cálculo de bordes más rápido)
    const SCALE_ANALYSIS = Math.max(1, Math.min(vw, vh) / 512);
    work.width  = Math.round(vw / SCALE_ANALYSIS);
    work.height = Math.round(vh / SCALE_ANALYSIS);
    draw.width = TARGET_SIZE; draw.height = TARGET_SIZE;

    const wctx = work.getContext("2d", { willReadFrequently: true })!;
    const dctx = draw.getContext("2d", { willReadFrequently: true })!;

    setExtracting(true); setProgress(0);
    frames.forEach((u) => URL.revokeObjectURL(u));
    const urls: string[] = [];

    // EMA para centro/escala
    let emaCx = work.width / 2, emaCy = work.height / 2, emaR = Math.min(work.width, work.height) * 0.35;
    const ALPHA = 0.35;

    const dt = duration / N_FRAMES;

    for (let i = 0; i < N_FRAMES; i++) {
      const t = i * dt;
      await seekTo(v, t);

      // 1) volcar frame escalado a canvas de trabajo
      wctx.drawImage(v, 0, 0, work.width, work.height);

      // 2) centro de masa de bordes (aprox objeto)
      const img = wctx.getImageData(0, 0, work.width, work.height);
      const { cx, cy, radius } = sobelCenterOfMass(img);

      // 3) suavizar centro/escala
      emaCx = emaCx * (1 - ALPHA) + cx * ALPHA;
      emaCy = emaCy * (1 - ALPHA) + cy * ALPHA;
      emaR  = emaR  * (1 - ALPHA) + radius * ALPHA;

      // 4) recorte cuadrado alrededor del centro suavizado
      // expandimos un poco el radio para margen
      const pad = 1.25;
      const side = Math.min(work.width, work.height, Math.max(64, Math.round(emaR * 2 * pad)));
      const sx = Math.max(0, Math.floor(emaCx - side / 2));
      const sy = Math.max(0, Math.floor(emaCy - side / 2));
      const sSide = Math.min(side, work.width - sx, work.height - sy);

      // 5) dibujar al canvas final (fondo blanco consistente)
      dctx.save();
      dctx.clearRect(0, 0, TARGET_SIZE, TARGET_SIZE);
      dctx.fillStyle = "#ffffff";
      dctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);
      dctx.drawImage(work, sx, sy, sSide, sSide, 0, 0, TARGET_SIZE, TARGET_SIZE);

      // 6) normalización suave de exposición
      histogramNormalize(dctx, TARGET_SIZE, TARGET_SIZE, 0.18);
      dctx.restore();

      // 7) exportar frame comprimido
      const blob: Blob = await new Promise((res) => dctx.canvas.toBlob(b => res(b as Blob), "image/webp", 0.92));
      const url = URL.createObjectURL(blob);
      urls.push(url);

      setProgress(Math.round(((i + 1) / N_FRAMES) * 100));
      await new Promise((r) => setTimeout(r, 0));
    }

    setFrames(urls);
    setCurrent(0);
    setExtracting(false);
  }, [duration, frames]);

  // VISOR 360 ---------------------------------------------------------------
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

  const canExtract = useMemo(() => loaded && objUrl && !extracting, [loaded, objUrl, extracting]);

  const clearVideo = () => {
    if (objUrl) URL.revokeObjectURL(objUrl);
    frames.forEach((u) => URL.revokeObjectURL(u));
    setObjUrl(""); setFrames([]); setLoaded(false); setDuration(0);
    setProgress(0); setCurrent(0);
  };

  // badge de entorno
  const isPreview = typeof process !== "undefined" && process.env.NEXT_PUBLIC_DUMMY === undefined;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-5xl mx-auto pt-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Create a 360 product from a video</h1>
          <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">Preview</span>
        </div>
        <p className="mt-2 text-slate-600">
          Upload a short spin video (8–12s). We extract <b>36 frames</b> in the browser and build a 360° viewer (drag to rotate).
          This is <b>Preview-only</b>; no backend uploads.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center px-4 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition cursor-pointer">
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
                {extracting ? "Extracting…" : "Generate 360 (stabilized)"}
              </button>
              <button onClick={clearVideo} className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition text-sm">
                Reset
              </button>
            </>
          )}

          {loaded ? (
            <span className="text-emerald-600 text-sm">Video ready</span>
          ) : objUrl ? (
            <span className="text-slate-500 text-sm">Loading metadata…</span>
          ) : null}
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-white/70 backdrop-blur p-3 shadow">
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

            {extracting && (
              <div className="mt-3">
                <div className="h-2 bg-slate-200 rounded">
                  <div className="h-2 bg-slate-800 rounded transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs mt-2 text-slate-500">Extracting frames… {progress}%</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white/70 backdrop-blur p-3 shadow">
            {!frames.length ? (
              <div className="aspect-square grid place-items-center text-slate-500">
                <p>When frames are ready, the 360° viewer appears here.</p>
              </div>
            ) : (
              <div className="select-none touch-none" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onPointerMove={onPointerMove}>
                <img src={frames[current]} alt={`frame-${current}`} draggable={false} className="w-full h-auto rounded-lg" />
                <div className="text-center mt-2 text-xs text-slate-500">
                  Drag horizontally to rotate • {current + 1}/{frames.length}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* canvases ocultos */}
        <canvas ref={workCanvasRef} className="hidden" />
        <canvas ref={drawCanvasRef} className="hidden" />
      </div>
    </main>
  );
}
