"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function SpinVideoPage() {
  const N_FRAMES = 36;
  const TARGET_SIZE = 640;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<File | null>(null);

  const [objUrl, setObjUrl] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [duration, setDuration] = useState(0);

  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);

  const [cloudBusy, setCloudBusy] = useState(false);

  useEffect(() => () => { if (objUrl) URL.revokeObjectURL(objUrl); }, [objUrl]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      fileRef.current = f;
      if (objUrl) URL.revokeObjectURL(objUrl);
      setFrames([]); setCurrent(0); setLoaded(false); setDuration(0);
      const url = URL.createObjectURL(f);
      setObjUrl(url);
    } catch (err) { console.error(err); alert("Error al cargar el video."); }
  };

  const onLoadedMeta = () => {
    const v = videoRef.current; if (!v) return;
    setDuration(v.duration || 0); setLoaded(true); v.pause(); v.currentTime = 0;
  };

  const seekTo = (v: HTMLVideoElement, t: number) =>
    new Promise<void>((resolve) => {
      const onSeek = () => { v.removeEventListener("seeked", onSeek); resolve(); };
      v.addEventListener("seeked", onSeek, { once: true });
      v.currentTime = Math.min(Math.max(t, 0), v.duration || 0);
    });

  const extractFrames = useCallback(async (nFrames = N_FRAMES) => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !duration) return;
    try {
      try { v.muted = true; await v.play(); v.pause(); } catch {}
      const vw = v.videoWidth, vh = v.videoHeight;
      if (!vw || !vh) throw new Error("El video no tiene dimensiones válidas.");
      const side = Math.min(vw, vh);
      const sx = (vw - side) / 2, sy = (vh - side) / 2;

      c.width = TARGET_SIZE; c.height = TARGET_SIZE;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas.");

      setExtracting(true); setProgress(0);
      const urls: string[] = [];
      const dt = duration / nFrames;

      for (let i = 0; i < nFrames; i++) {
        await seekTo(v, i * dt);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(v, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);
        urls.push(c.toDataURL("image/webp", 0.92));
        setProgress(Math.round(((i + 1) / nFrames) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }
      setFrames(urls); setCurrent(0);
    } catch (err) { console.error(err); alert("Error generando frames. Reintenta con un video 8–12s."); }
    finally { setExtracting(false); }
  }, [duration]);

  // --- compresión cliente: 480x480, 12fps, primeros 8s, WebM ---
  async function compressVideoToSquareWebM(file: File, maxSecs=8, fps=12, SIZE=480): Promise<Blob> {
    const src = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.src = src; v.muted = true; v.playsInline = true; await v.play(); v.pause();
    await new Promise<void>(res => {
      if (v.readyState >= 1) return res();
      v.addEventListener("loadedmetadata", () => res(), { once: true });
    });

    const cn = document.createElement("canvas");
    cn.width = SIZE; cn.height = SIZE;
    const cx = cn.getContext("2d", { willReadFrequently: true })!;

    const side = Math.min(v.videoWidth, v.videoHeight);
    const sx = (v.videoWidth - side) / 2;
    const sy = (v.videoHeight - side) / 2;

    const stream = cn.captureStream(fps);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_000_000 }); // ~1Mbps
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

    const endAt = Math.min(maxSecs, v.duration || maxSecs);
    let rafId = 0; let started = false; const t0 = performance.now();

    function loop() {
      const elapsed = (performance.now() - t0) / 1000;
      const t = Math.min(elapsed, endAt);
      v.currentTime = t;
      cx.clearRect(0,0,SIZE,SIZE);
      cx.drawImage(v, sx, sy, side, side, 0, 0, SIZE, SIZE);
      if (elapsed < endAt) { rafId = requestAnimationFrame(loop); }
      else { rec.stop(); cancelAnimationFrame(rafId); }
    }

    await new Promise<void>((resolve) => {
      rec.onstart = () => { started = true; loop(); };
      rec.onstop = () => resolve();
      rec.start(100); // ms
    });

    URL.revokeObjectURL(src);
    return new Blob(chunks, { type: mime });
  }

  // 1-click: comprimir → subir a /api/rvm → recibir video limpio → extraer frames
  const generateCleanCloud = useCallback(async () => {
    const f = fileRef.current;
    if (!f) { alert("Elige un video primero."); return; }
    try {
      setCloudBusy(true);

      // compresión previa para no reventar el límite del serverless
      const small = await compressVideoToSquareWebM(f, 8, 12, 480);

      const fd = new FormData();
      fd.append("video", new File([small], "clip.webm", { type: small.type }));

      const res = await fetch("/api/rvm", { method: "POST", body: fd });
      if (!res.ok) {
        const msg = await res.text().catch(() => String(res.status));
        throw new Error(`RVM ${res.status}: ${msg}`);
      }

      const blob = await res.blob();
      const cleanUrl = URL.createObjectURL(blob);

      if (objUrl) URL.revokeObjectURL(objUrl);
      setObjUrl(cleanUrl);
      setFrames([]); setCurrent(0); setLoaded(false); setDuration(0);

      // esperar metadatos del video limpio
      await new Promise<void>((resolve) => {
        const vtag = videoRef.current;
        if (!vtag) return resolve();
        const onMeta = () => { vtag.removeEventListener("loadedmetadata", onMeta); resolve(); };
        vtag.addEventListener("loadedmetadata", onMeta, { once: true });
      });

      await extractFrames(N_FRAMES);
    } catch (e:any) {
      console.error(e);
      alert(e?.message || "Fallo procesando en la nube.");
    } finally {
      setCloudBusy(false);
    }
  }, [extractFrames, objUrl]);

  // visor 360
  const onPointerDown = (ev: React.PointerEvent) => { if (!frames.length) return; setDragging(true); (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId); };
  const onPointerUp = (ev: React.PointerEvent) => { setDragging(false); (ev.target as HTMLElement).releasePointerCapture?.(ev.pointerId); };
  const onPointerMove = (ev: React.PointerEvent) => {
    if (!dragging || !frames.length) return;
    const delta = Math.trunc(ev.movementX / 6);
    if (delta) setCurrent(i => { let n = (i - delta) % frames.length; if (n < 0) n += frames.length; return n; });
  };

  const canExtract = useMemo(() => loaded && !!objUrl && !extracting && !cloudBusy, [loaded, objUrl, extracting, cloudBusy]);

  const clearVideo = () => {
    if (objUrl) URL.revokeObjectURL(objUrl);
    setObjUrl(""); setFrames([]); setLoaded(false); setDuration(0);
    setProgress(0); setCurrent(0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-6xl mx-auto pt-10">
        <h1 className="text-3xl md:text-4xl font-bold">Create a 360 product from a video</h1>
        <p className="mt-2 text-slate-600">
          Upload a short spin video. Extract <b>{N_FRAMES} frames</b> locally or use <b>Cloud RVM</b> (with client-side compression).
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
                disabled={cloudBusy || !fileRef.current}
                onClick={generateCleanCloud}
                className="px-3 py-2 rounded-lg border bg-emerald-600 text-white shadow-sm hover:shadow transition disabled:opacity-50 text-sm"
              >
                {cloudBusy ? "Processing in cloud…" : "Generate Clean 36 (Cloud RVM)"}
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

            {(extracting || cloudBusy) && (
              <div className="mt-3">
                <div className="h-2 bg-slate-200 rounded">
                  <div className="h-2 bg-slate-800 rounded transition-all" style={{ width: `${extracting ? progress : 100}%` }} />
                </div>
                <p className="text-xs mt-2 text-slate-500">
                  {extracting ? `Extracting… ${progress}%` : `Processing in cloud…`}
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
