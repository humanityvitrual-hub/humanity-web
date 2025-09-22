"use client";

import { useCallback, useMemo, useRef, useState } from "react";

export default function SpinVideoPage() {
  const N_FRAMES = 36;
  const TARGET_SIZE = 640;

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

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      if (objUrl) URL.revokeObjectURL(objUrl);
      setFrames([]);
      setCurrent(0);
      setLoaded(false);
      setDuration(0);
      setProgress(0);
      const url = URL.createObjectURL(f);
      setObjUrl(url);
    } catch (err) {
      console.error(err);
      alert("Error leyendo el archivo de video.");
    }
  };

  const onLoadedMeta = () => {
    try {
      const v = videoRef.current;
      if (!v) return;
      setDuration(v.duration || 0);
      setLoaded(true);
      v.pause();
      v.currentTime = 0;
    } catch (err) {
      console.error(err);
      alert("No se pudo leer la metadata del video.");
    }
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

  const extractFrames = useCallback(async () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) {
      alert("No hay video o canvas disponible.");
      return;
    }
    try {
      // algunos navegadores exigen play() antes de dibujar frames
      try {
        v.muted = true;
        await v.play();
        v.pause();
      } catch {
        // ignorar si el navegador no lo permite
      }

      const vw = v.videoWidth;
      const vh = v.videoHeight;
      if (!vw || !vh) {
        alert("El video aún no está listo. ¿Cargó la metadata?");
        return;
      }

      const side = Math.min(vw, vh);
      const sx = (vw - side) / 2;
      const sy = (vh - side) / 2;

      c.width = TARGET_SIZE;
      c.height = TARGET_SIZE;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        alert("No se pudo obtener el contexto 2D del canvas.");
        return;
      }

      setExtracting(true);
      setProgress(0);

      const urls: string[] = [];
      const dt = (duration || v.duration || 0) / N_FRAMES;

      for (let i = 0; i < N_FRAMES; i++) {
        const t = i * dt;
        await seekTo(v, t);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(v, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);

        const dataUrl = c.toDataURL("image/webp", 0.92);
        urls.push(dataUrl);
        setProgress(Math.round(((i + 1) / N_FRAMES) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }

      setFrames(urls);
      setCurrent(0);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al extraer los frames.");
    } finally {
      setExtracting(false);
    }
  }, [duration]);

  // Viewer simple (drag para rotar)
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
    try {
      if (objUrl) URL.revokeObjectURL(objUrl);
    } catch {}
    setObjUrl("");
    setFrames([]);
    setLoaded(false);
    setDuration(0);
    setProgress(0);
    setCurrent(0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-6xl mx-auto pt-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Create a 360 product from a video</h1>
        <p className="mt-2 text-slate-600">
          Upload a short spin video (8–12s). We extract <b>36 frames</b> in the browser and build a simple 360° viewer (drag to rotate).
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
                {extracting ? "Extracting…" : "Generate 36 frames"}
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
            </>
          )}
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
                  <div
                    className="h-2 bg-slate-800 rounded transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs mt-2 text-slate-500">Extracting frames… {progress}%</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white/70 backdrop-blur p-3 shadow">
            {!frames.length ? (
              <div className="aspect-square grid place-items-center text-slate-500">
                <p>When frames are ready, the viewer appears here.</p>
              </div>
            ) : (
              <div
                className="relative aspect-square select-none overflow-hidden rounded-lg border bg-white"
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerMove={onPointerMove}
              >
                <img
                  src={frames[current]}
                  alt={`frame ${current + 1}/${frames.length}`}
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />
                <div className="absolute bottom-2 right-3 text-[10px] text-slate-600 bg-white/70 rounded px-1 py-0.5">
                  {current + 1}/{frames.length}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
