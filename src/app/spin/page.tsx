"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as ort from "onnxruntime-web";

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

  // ==== Estado para matting (remove background) ====
  const [matting, setMatting] = useState(false);
  const [matteProgress, setMatteProgress] = useState(0);
  const sessionRef = useRef<ort.InferenceSession | null>(null);

  // Limpieza del ObjectURL al cambiar de video o desmontar
  useEffect(() => {
    return () => {
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [objUrl]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      if (objUrl) URL.revokeObjectURL(objUrl);
      setFrames([]);
      setCurrent(0);
      setLoaded(false);
      setDuration(0);
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

  // helper de seek confiable
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
    if (!v || !c || !duration) return;

    try {
      // “desbloqueo” iOS/Safari: play/pause para permitir dibujar frames
      try { v.muted = true; await v.play(); v.pause(); } catch {}

      const vw = v.videoWidth;
      const vh = v.videoHeight;
      if (!vw || !vh) throw new Error("El video no tiene dimensiones válidas.");

      // recorte cuadrado centrado
      const side = Math.min(vw, vh);
      const sx = (vw - side) / 2;
      const sy = (vh - side) / 2;

      c.width = TARGET_SIZE;
      c.height = TARGET_SIZE;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas.");

      setExtracting(true);
      setProgress(0);

      const urls: string[] = [];
      const dt = duration / N_FRAMES;

      for (let i = 0; i < N_FRAMES; i++) {
        const t = i * dt;
        await seekTo(v, t);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(v, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);

        // dataURL directo (evita blob: y CORS/fetch issues)
        const dataUrl = c.toDataURL("image/webp", 0.92);
        urls.push(dataUrl);

        setProgress(Math.round(((i + 1) / N_FRAMES) * 100));
        await new Promise((r) => setTimeout(r, 0)); // ceder al UI
      }

      setFrames(urls);
      setCurrent(0);
    } catch (err) {
      console.error(err);
      alert("Error generando frames. Reintenta con un video 8–12s.");
    } finally {
      setExtracting(false);
    }
  }, [duration]);

  // Visor 360 (drag → cambia índice)
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
    const SENS = 6; // mayor → menos sensible
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

  // =======================
  // REMOVE BACKGROUND (beta)
  // =======================

  // Carga del modelo ONNX bajo demanda
  const loadU2Net = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;
    const session = await ort.InferenceSession.create("/models/u2netp.onnx", {
      executionProviders: ["wasm"],
    });
    sessionRef.current = session;
    return session;
  }, []);

  // Convierte un frame (dataURL) a tensor 1x3x320x320 con letterbox
  const imageToTensor = async (dataUrl: string) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();

    const SIZE = 320;
    const cn = document.createElement("canvas");
    cn.width = SIZE; cn.height = SIZE;
    const cx = cn.getContext("2d", { willReadFrequently: true })!;
    cx.fillStyle = "#000";
    cx.fillRect(0, 0, SIZE, SIZE);

    const s = Math.min(SIZE / img.width, SIZE / img.height);
    const w = Math.round(img.width * s);
    const h = Math.round(img.height * s);
    const x = Math.floor((SIZE - w) / 2);
    const y = Math.floor((SIZE - h) / 2);
    cx.drawImage(img, x, y, w, h);

    const { data } = cx.getImageData(0, 0, SIZE, SIZE);
    const chw = new Float32Array(1 * 3 * SIZE * SIZE);
    const stride = SIZE * SIZE;
    let p = 0;
    for (let i = 0; i < SIZE * SIZE; i++) {
      const r = data[p++] / 255;
      const g = data[p++] / 255;
      const b = data[p++] / 255;
      p++; // A
      chw[i] = r;
      chw[i + stride] = g;
      chw[i + stride * 2] = b;
    }
    const tensor = new ort.Tensor("float32", chw, [1, 3, SIZE, SIZE]);
    return { tensor, box: { x, y, w, h, size: SIZE } };
  };

  // Ejecuta U2Netp y devuelve un frame con fondo blanco (solo sujeto)
  const runMatte = async (dataUrl: string) => {
    const session = await loadU2Net();
    const { tensor, box } = await imageToTensor(dataUrl);
    const feeds: Record<string, ort.Tensor> = {};
    const inputName = session.inputNames[0] || "input";
    feeds[inputName] = tensor;
    const output = await session.run(feeds);
    const out = output[session.outputNames[0]];
    if (!out) throw new Error("Salida del modelo no encontrada.");

    const SIZE = box.size;
    const mask = (out as ort.Tensor).data as Float32Array; // 1x1x320x320

    // Construir máscara RGBA 320x320
    const mcn = document.createElement("canvas");
    mcn.width = SIZE; mcn.height = SIZE;
    const mctx = mcn.getContext("2d", { willReadFrequently: true })!;
    const id = mctx.createImageData(SIZE, SIZE);
    let q = 0;
    for (let i = 0; i < SIZE * SIZE; i++) {
      const a = Math.max(0, Math.min(255, Math.round(mask[i] * 255)));
      id.data[q++] = 255; // R
      id.data[q++] = 255; // G
      id.data[q++] = 255; // B
      id.data[q++] = a;   // A
    }
    mctx.putImageData(id, 0, 0);

    // Escalar máscara (quitando letterbox) a TARGET_SIZE
    const maskFinal = document.createElement("canvas");
    maskFinal.width = TARGET_SIZE; maskFinal.height = TARGET_SIZE;
    const mfx = maskFinal.getContext("2d")!;
    mfx.drawImage(mcn, box.x, box.y, box.w, box.h, 0, 0, TARGET_SIZE, TARGET_SIZE);

    // Componer: fondo blanco + frame recortado por máscara
    const outCn = document.createElement("canvas");
    outCn.width = TARGET_SIZE; outCn.height = TARGET_SIZE;
    const outCx = outCn.getContext("2d", { willReadFrequently: true })!;

    // Fondo blanco
    outCx.fillStyle = "#fff";
    outCx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

    // Frame original reescalado a TARGET_SIZE (ya venía en ese tamaño)
    const img = new Image();
    img.src = dataUrl;
    await img.decode();

    // Aplicar máscara al frame y pintar
    const fg = document.createElement("canvas");
    fg.width = TARGET_SIZE; fg.height = TARGET_SIZE;
    const fgx = fg.getContext("2d")!;
    fgx.drawImage(img, 0, 0, TARGET_SIZE, TARGET_SIZE);
    fgx.globalCompositeOperation = "destination-in";
    fgx.drawImage(maskFinal, 0, 0);

    outCx.globalCompositeOperation = "source-over";
    outCx.drawImage(fg, 0, 0);

    return outCn.toDataURL("image/webp", 0.92);
  };

  const removeBackgroundAll = useCallback(async () => {
    if (!frames.length) {
      alert("Genera los 36 frames primero.");
      return;
    }
    try {
      setMatting(true);
      setMatteProgress(0);
      const out: string[] = [];
      for (let i = 0; i < frames.length; i++) {
        const url = await runMatte(frames[i]);
        out.push(url);
        setMatteProgress(Math.round(((i + 1) / frames.length) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }
      setFrames(out);
      setCurrent(0);
    } catch (e) {
      console.error(e);
      alert("Falló la segmentación. Prueba con fondo más contrastado o mejor luz.");
    } finally {
      setMatting(false);
    }
  }, [frames]);
  // ======= fin remove background =======

  const clearVideo = () => {
    if (objUrl) URL.revokeObjectURL(objUrl);
    setObjUrl("");
    setFrames([]);
    setLoaded(false);
    setDuration(0);
    setProgress(0);
    setCurrent(0);
    setMatteProgress(0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-6xl mx-auto pt-10">
        <h1 className="text-3xl md:text-4xl font-bold">Create a 360 product from a video</h1>
        <p className="mt-2 text-slate-600">
          Upload a short spin video (8–12s). We extract <b>36 frames</b> in the browser and build a 360° viewer.
          This is <b>Preview-only</b>; no backend uploads.
        </p>

        {/* Controles */}
        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center px-4 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow cursor-pointer">
            <input type="file" accept="video/*;capture=environment" onChange={onPickFile} className="sr-only" />
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

              {/* Remove background (beta) — cliente puro */}
              <button
                disabled={!frames.length || matting}
                onClick={removeBackgroundAll}
                className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition disabled:opacity-50 text-sm"
                title={!frames.length ? "Generate frames first" : "Remove background (beta)"}
              >
                {matting ? `Removing… ${matteProgress}%` : "Remove background (beta)"}
              </button>

              {loaded ? (
                <span className="text-emerald-600 text-sm">Video ready</span>
              ) : objUrl ? (
                <span className="text-slate-500 text-sm">Loading metadata…</span>
              ) : null}
            </>
          )}
        </div>

        {/* Lado izquierdo: video + progreso */}
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

            {(extracting || matting) && (
              <div className="mt-3">
                <div className="h-2 bg-slate-200 rounded">
                  <div
                    className="h-2 bg-slate-800 rounded transition-all"
                    style={{ width: `${extracting ? progress : matteProgress}%` }}
                  />
                </div>
                <p className="text-xs mt-2 text-slate-500">
                  {extracting ? `Extracting frames… ${progress}%` : `Removing background… ${matteProgress}%`}
                </p>
              </div>
            )}
          </div>

          {/* Lado derecho: visor */}
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
