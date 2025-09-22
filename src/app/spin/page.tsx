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

  // Memoria temporal de máscara (para estabilizar entre frames)
  const lastMaskRef = useRef<Float32Array | null>(null);

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
      setMatteProgress(0);
      lastMaskRef.current = null; // reset memoria temporal
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
      // “desbloqueo” iOS/Safari
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

        const dataUrl = c.toDataURL("image/webp", 0.92);
        urls.push(dataUrl);

        setProgress(Math.round(((i + 1) / N_FRAMES) * 100));
        await new Promise((r) => setTimeout(r, 0));
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

  // Visor 360 (drag)
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

  // =======================
  // REMOVE BACKGROUND (beta) con SUAVIZADO + HISTÉRESIS
  // =======================

  // Suavizado 3x3 (box blur) en Float32 [0..1]
  function blur3x3Float(src: Float32Array, w: number, h: number, iters = 1) {
    let a = src, b = new Float32Array(src.length);
    const idx = (x: number, y: number) => y * w + x;
    for (let k = 0; k < iters; k++) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sum = 0, count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const xx = x + dx, yy = y + dy;
              if (xx >= 0 && xx < w && yy >= 0 && yy < h) {
                sum += a[idx(xx, yy)]; count++;
              }
            }
          }
          b[idx(x, y)] = sum / count;
        }
      }
      // swap
      const tmp = a; a = b; b = tmp;
    }
    return a; // suavizado
  }

  // Curva tipo smoothstep para endurecer borde con feather
  const smoothstep = (edge0: number, edge1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  };

  // Carga del modelo ONNX
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
      chw[i] = r; chw[i + stride] = g; chw[i + stride * 2] = b;
    }
    const tensor = new ort.Tensor("float32", chw, [1, 3, SIZE, SIZE]);
    return { tensor, box: { x, y, w, h, size: SIZE } };
  };

  // Ejecuta U2Netp y devuelve un frame con fondo blanco (solo sujeto), con estabilización
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
    // mask320: Float32 [0..1] tamaño 320x320
    let mask320 = (out as ort.Tensor).data as Float32Array;

    // 1) Suavizado espacial (reduce "dientes" y huecos)
    mask320 = blur3x3Float(mask320, SIZE, SIZE, 2);

    // 2) Curva/umbral suave para consolidar primer plano
    //    - edge0: tolerancia (ruido desaparece)
    //    - edge1: borde con feather
    const edge0 = 0.25, edge1 = 0.55;
    for (let i = 0; i < mask320.length; i++) {
      mask320[i] = smoothstep(edge0, edge1, mask320[i]);
    }

    // 3) Histéresis temporal: no perder de golpe lo que era foreground recién
    const prev = lastMaskRef.current;
    if (prev && prev.length === mask320.length) {
      const decay = 0.88; // 88% mantiene “memoria” del frame previo
      for (let i = 0; i < mask320.length; i++) {
        const mem = prev[i] * decay;
        if (mem > mask320[i]) mask320[i] = mem;
      }
    }
    // guarda para el siguiente frame
    lastMaskRef.current = Float32Array.from(mask320);

    // Construir máscara RGBA 320
    const mcn = document.createElement("canvas");
    mcn.width = SIZE; mcn.height = SIZE;
    const mctx = mcn.getContext("2d", { willReadFrequently: true })!;
    const id = mctx.createImageData(SIZE, SIZE);
    let q = 0;
    for (let i = 0; i < SIZE * SIZE; i++) {
      const a = Math.max(0, Math.min(255, Math.round(mask320[i] * 255)));
      id.data[q++] = 255; id.data[q++] = 255; id.data[q++] = 255; id.data[q++] = a;
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
    outCx.fillStyle = "#fff"; outCx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

    const img = new Image();
    img.src = dataUrl; await img.decode();

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
      lastMaskRef.current = null; // reinicia memoria al empezar
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
      alert("Falló la segmentación. Prueba con fondo más contrastante o mejor luz.");
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
    lastMaskRef.current = null;
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

              {/* Remove background (beta) — con suavizado + histéresis */}
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
