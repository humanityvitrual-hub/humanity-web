"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as ort from "onnxruntime-web";

export default function SpinVideoPage() {
  // ===== CONFIG =====
  const N_FRAMES = 36;           // volvemos al baseline estable
  const TARGET_SIZE = 640;       // salida cuadrada
  const MATTE_EDGE0 = 0.22;      // umbral suave bajo
  const MATTE_EDGE1 = 0.5;       // umbral suave alto
  const DECAY = 0.90;            // memoria temporal

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

  // Matting + estabilidad
  const [matting, setMatting] = useState(false);
  const [matteProgress, setMatteProgress] = useState(0);
  const sessionRef = useRef<ort.InferenceSession | null>(null);
  const lastMaskRef = useRef<Float32Array | null>(null);

  // Fondo LAB multi-zona (para asistir el recorte); NO hacemos bbox-normalization.
  const bgLabsRef = useRef<Array<{L:number;a:number;b:number;sigma:number}>>([]);

  // ===== lifecycle =====
  useEffect(() => () => { if (objUrl) URL.revokeObjectURL(objUrl); }, [objUrl]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      if (objUrl) URL.revokeObjectURL(objUrl);
      setFrames([]); setCurrent(0); setLoaded(false); setDuration(0);
      setMatteProgress(0);
      lastMaskRef.current = null;
      bgLabsRef.current = [];
      const url = URL.createObjectURL(f);
      setObjUrl(url);
    } catch (err) { console.error(err); alert("Error al cargar el video."); }
  };

  const onLoadedMeta = () => {
    const v = videoRef.current; if (!v) return;
    setDuration(v.duration || 0); setLoaded(true); v.pause(); v.currentTime = 0;
  };

  // ===== helpers =====
  const seekTo = (v: HTMLVideoElement, t: number) =>
    new Promise<void>((resolve) => {
      const onSeek = () => { v.removeEventListener("seeked", onSeek); resolve(); };
      v.addEventListener("seeked", onSeek, { once: true });
      v.currentTime = Math.min(Math.max(t, 0), v.duration || 0);
    });

  // ===== extracción de frames =====
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

  // ===== visor 360 =====
  const onPointerDown = (ev: React.PointerEvent) => {
    if (!frames.length) return;
    setDragging(true); (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
  };
  const onPointerUp = (ev: React.PointerEvent) => {
    setDragging(false); (ev.target as HTMLElement).releasePointerCapture?.(ev.pointerId);
  };
  const onPointerMove = (ev: React.PointerEvent) => {
    if (!dragging || !frames.length) return;
    const SENS = 6; const delta = Math.trunc(ev.movementX / SENS);
    if (delta) setCurrent((i) => { let n = (i - delta) % frames.length; if (n < 0) n += frames.length; return n; });
  };

  const canExtract = useMemo(() => loaded && !!objUrl && !extracting, [loaded, objUrl, extracting]);

  // ===== util de máscara =====
  function blur3x3Float(src: Float32Array, w: number, h: number, iters = 1) {
    let a = src, b = new Float32Array(src.length);
    const idx = (x: number, y: number) => y * w + x;
    for (let k = 0; k < iters; k++) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let sum = 0, count = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && xx < w && yy >= 0 && yy < h) { sum += a[idx(xx, yy)]; count++; }
        }
        b[idx(x, y)] = sum / count;
      }
      const tmp = a; a = b; b = tmp;
    }
    return a;
  }
  function dilate3x3(src: Float32Array, w: number, h: number) {
    const dst = new Float32Array(src.length);
    const idx = (x: number, y: number) => y * w + x;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let m = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < w && yy >= 0 && yy < h) m = Math.max(m, src[idx(xx, yy)]);
      }
      dst[idx(x, y)] = m;
    }
    return dst;
  }
  function erode3x3(src: Float32Array, w: number, h: number) {
    const dst = new Float32Array(src.length);
    const idx = (x: number, y: number) => y * w + x;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let m = 1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < w && yy >= 0 && yy < h) m = Math.min(m, src[idx(xx, yy)]);
      }
      dst[idx(x, y)] = m;
    }
    return dst;
  }
  function largestComponent(src: Float32Array, w: number, h: number, thr=0.5) {
    const N = w*h, visited = new Uint8Array(N);
    const idx = (x:number,y:number)=> y*w + x;
    let bestSize = 0, bestMask = new Float32Array(N);
    const stackX:number[] = [], stackY:number[] = [];
    for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
      const i = idx(x,y);
      if (visited[i] || src[i] < thr) continue;
      let size = 0; const cur = new Float32Array(N);
      stackX.length=0; stackY.length=0; stackX.push(x); stackY.push(y);
      visited[i]=1;
      while (stackX.length) {
        const cx = stackX.pop()!, cy = stackY.pop()!;
        const ci = idx(cx,cy); cur[ci] = src[ci]; size++;
        for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
          if (dx===0 && dy===0) continue;
          const nx=cx+dx, ny=cy+dy;
          if (nx<0||nx>=w||ny<0||ny>=h) continue;
          const ni = idx(nx,ny);
          if (!visited[ni] && src[ni] >= thr) { visited[ni]=1; stackX.push(nx); stackY.push(ny); }
        }
      }
      if (size > bestSize) { bestSize = size; bestMask = cur; }
    }
    return bestMask;
  }
  const smoothstep = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };

  // ===== RGB -> LAB =====
  function rgb2xyz(r:number,g:number,b:number) {
    r/=255; g/=255; b/=255;
    r = r>0.04045 ? Math.pow((r+0.055)/1.055,2.4):r/12.92;
    g = g>0.04045 ? Math.pow((g+0.055)/1.055,2.4):g/12.92;
    b = b>0.04045 ? Math.pow((b+0.055)/1.055,2.4):b/12.92;
    const x = (r*0.4124 + g*0.3576 + b*0.1805)/0.95047;
    const y = (r*0.2126 + g*0.7152 + b*0.0722)/1.00000;
    const z = (r*0.0193 + g*0.1192 + b*0.9505)/1.08883;
    return {x,y,z};
  }
  function xyz2lab(x:number,y:number,z:number) {
    const f=(t:number)=> t>0.008856? Math.cbrt(t):(7.787*t+16/116);
    const fx=f(x), fy=f(y), fz=f(z);
    return { L:116*fy-16, a:500*(fx-fy), b:200*(fy-fz) };
  }
  function rgb2lab(r:number,g:number,b:number){ const {x,y,z}=rgb2xyz(r,g,b); return xyz2lab(x,y,z); }
  function deltaE(a:{L:number;a:number;b:number}, b:{L:number;a:number;b:number}){
    const dL=a.L-b.L, da=a.a-b.a, db=a.b-b;
    return Math.sqrt(dL*dL+da*da+db*db);
  }

  // ===== Modelo ONNX =====
  const loadU2Net = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;
    const session = await ort.InferenceSession.create("/models/u2netp.onnx", { executionProviders: ["wasm"] });
    sessionRef.current = session;
    return session;
  }, []);

  // Prepara 320x320 + letterbox. Devuelve tensor y RGBA para análisis.
  const prepareInput = async (dataUrl: string) => {
    const img = new Image(); img.src = dataUrl; await img.decode();
    const SIZE = 320;
    const cn = document.createElement("canvas"); cn.width = SIZE; cn.height = SIZE;
    const cx = cn.getContext("2d", { willReadFrequently: true })!;
    cx.fillStyle = "#000"; cx.fillRect(0, 0, SIZE, SIZE);
    const s = Math.min(SIZE / img.width, SIZE / img.height);
    const w = Math.round(img.width * s), h = Math.round(img.height * s);
    const x = Math.floor((SIZE - w) / 2), y = Math.floor((SIZE - h) / 2);
    cx.drawImage(img, x, y, w, h);
    const rgba = cx.getImageData(0, 0, SIZE, SIZE);

    const chw = new Float32Array(1 * 3 * SIZE * SIZE);
    const stride = SIZE * SIZE;
    for (let i = 0, p = 0; i < SIZE * SIZE; i++) {
      const r = rgba.data[p++] / 255, g = rgba.data[p++] / 255, b = rgba.data[p++] / 255;
      p++; chw[i] = r; chw[i + stride] = g; chw[i + stride * 2] = b;
    }
    const tensor = new ort.Tensor("float32", chw, [1, 3, SIZE, SIZE]);
    return { tensor, box: { x, y, w, h, size: SIZE }, rgba };
  };

  // Estima múltiples colores de fondo (LAB) en bordes y esquinas
  function estimateBgLabs(rgba: ImageData, box: {x:number;y:number;w:number;h:number;size:number}) {
    const W = rgba.width, H = rgba.height, data = rgba.data;
    const pad = 12;
    const x0 = Math.max(0, box.x), y0 = Math.max(0, box.y);
    const x1 = Math.min(W, box.x + box.w), y1 = Math.min(H, box.y + box.h);
    const idx=(x:number,y:number)=> (y*W + x)*4;

    const regions = [
      {x:x0, y:y0, w:x1-x0, h:pad},                 // top
      {x:x0, y:y1-pad, w:x1-x0, h:pad},             // bottom
      {x:x0, y:y0, w:pad, h:y1-y0},                 // left
      {x:x1-pad, y:y0, w:pad, h:y1-y0},             // right
      {x:x0, y:y0, w:pad, h:pad},                   // tl
      {x:x1-pad, y:y0, w:pad, h:pad},               // tr
      {x:x0, y:y1-pad, w:pad, h:pad},               // bl
      {x:x1-pad, y:y1-pad, w:pad, h:pad},           // br
    ];

    const labs:Array<{L:number;a:number;b:number;sigma:number}> = [];
    for (const r of regions) {
      let sumL=0,sumA=0,sumB=0,n=0;
      for (let y=r.y;y<r.y+r.h;y++) for (let x=r.x;x<r.x+r.w;x++) {
        if (x<0||x>=W||y<0||y>=H) continue;
        const p=(y*W + x)*4; const lab=rgb2lab(data[p],data[p+1],data[p+2]);
        sumL+=lab.L; sumA+=lab.a; sumB+=lab.b; n++;
      }
      if (!n) continue;
      const mean={L:sumL/n, a:sumA/n, b:sumB/n};
      // sigma aprox (muestreo cada 3 px)
      let varSum=0,m=0;
      for (let y=r.y;y<r.y+r.h;y+=3) for (let x=r.x;x<r.x+r.w;x+=3) {
        if (x<0||x>=W||y<0||y>=H) continue;
        const p=(y*W + x)*4; const lab=rgb2lab(data[p],data[p+1],data[p+2]);
        const d=deltaE(lab,mean); varSum+=d*d; m++;
      }
      const sigma=Math.max(2, Math.min(20, Math.sqrt(varSum/Math.max(1,m))));
      labs.push({...mean, sigma});
    }
    return labs.length ? labs : [{L:100,a:0,b:0,sigma:10}];
  }

  // Probabilidad FG por mínima distancia a cualquiera de los fondos estimados
  function fgProbFromMultiBgLAB(rgba: ImageData, box: {x:number;y:number;w:number;h:number;size:number}, labs:Array<{L:number;a:number;b:number;sigma:number}>) {
    const W = rgba.width, H = rgba.height, data = rgba.data;
    const SIZE = box.size;
    const out = new Float32Array(SIZE*SIZE);
    for (let y=0;y<H;y++) for(let x=0;x<W;x++){
      const i=y*W+x;
      if (x<box.x || x>=box.x+box.w || y<box.y || y>=box.y+box.h) { out[i]=0; continue; }
      const p=(y*W + x)*4; const lab=rgb2lab(data[p],data[p+1],data[p+2]);
      let minRel = 1e9;
      for (const bg of labs) {
        const rel = deltaE(lab, {L:bg.L,a:bg.a,b:bg.b}) / (bg.sigma*2.5 + 1e-3);
        if (rel < minRel) minRel = rel;
      }
      let val = 1 - Math.min(1, Math.max(0, minRel));
      if (val < 0) val = 0;
      out[i] = val;
    }
    return out;
  }

  // ===== Pipeline (sin zoom, sin recorte por bbox) =====
  const runMatte = async (dataUrl: string, isFirst:boolean) => {
    const session = await loadU2Net();
    const { tensor, box, rgba } = await prepareInput(dataUrl);

    if (isFirst || !bgLabsRef.current.length) {
      bgLabsRef.current = estimateBgLabs(rgba, box);
    }

    // 1) Modelo
    const feeds: Record<string, ort.Tensor> = {};
    feeds[session.inputNames[0] || "input"] = tensor;
    const output = await session.run(feeds);
    const out = output[session.outputNames[0]];
    if (!out) throw new Error("Salida del modelo no encontrada.");
    const SIZE = box.size;
    let mask = (out as ort.Tensor).data as Float32Array; // 320x320 [0..1]

    // 2) Asistencia multi-fondo (LAB)
    const labAssist = fgProbFromMultiBgLAB(rgba, box, bgLabsRef.current);
    for (let i=0;i<mask.length;i++) mask[i] = Math.max(mask[i], labAssist[i]*0.95);

    // 3) Suavizado + curva suave
    mask = blur3x3Float(mask, SIZE, SIZE, 2);
    for (let i=0;i<mask.length;i++) mask[i] = smoothstep(MATTE_EDGE0, MATTE_EDGE1, mask[i]);

    // 4) Closing morfológico
    mask = dilate3x3(mask, SIZE, SIZE);
    mask = erode3x3(mask, SIZE, SIZE);

    // 5) Histéresis temporal (memoria)
    const prev = lastMaskRef.current;
    if (prev && prev.length === mask.length) {
      for (let i=0;i<mask.length;i++) {
        const mem = prev[i]*DECAY;
        if (mem > mask[i]) mask[i]=mem;
      }
    }
    lastMaskRef.current = Float32Array.from(mask);

    // 6) Componente mayor (pero SIN recortar/reescalar)
    const main = largestComponent(mask, SIZE, SIZE, 0.5);

    // 7) Máscara RGBA 320 del "main"
    const mcn = document.createElement("canvas"); mcn.width = SIZE; mcn.height = SIZE;
    const mctx = mcn.getContext("2d", { willReadFrequently: true })!;
    const id = mctx.createImageData(SIZE, SIZE);
    for (let i=0, q=0;i<SIZE*SIZE;i++){
      let a = main[i];
      if (a<0.45) a=0; else a = (a-0.45)/0.55; // feather leve
      const A = Math.max(0, Math.min(255, Math.round(a*255)));
      id.data[q++]=255; id.data[q++]=255; id.data[q++]=255; id.data[q++]=A;
    }
    mctx.putImageData(id, 0, 0);

    // 8) Escalar máscara del área válida (sin letterbox) a TARGET_SIZE, SIN bbox zoom
    const maskFinal = document.createElement("canvas"); maskFinal.width = TARGET_SIZE; maskFinal.height = TARGET_SIZE;
    const mfx = maskFinal.getContext("2d")!;
    mfx.drawImage(mcn, box.x, box.y, box.w, box.h, 0, 0, TARGET_SIZE, TARGET_SIZE);

    // 9) Componer con el frame original (sobre blanco), SIN recortes
    const outCn = document.createElement("canvas"); outCn.width = TARGET_SIZE; outCn.height = TARGET_SIZE;
    const outCx = outCn.getContext("2d", { willReadFrequently: true })!;
    outCx.fillStyle="#fff"; outCx.fillRect(0,0,TARGET_SIZE,TARGET_SIZE);

    const img = new Image(); img.src = dataUrl; await img.decode();
    const imgScaled = document.createElement("canvas"); imgScaled.width=TARGET_SIZE; imgScaled.height=TARGET_SIZE;
    const isx = imgScaled.getContext("2d")!; isx.drawImage(img, 0,0,TARGET_SIZE,TARGET_SIZE);
    isx.globalCompositeOperation = "destination-in"; isx.drawImage(maskFinal, 0, 0);
    outCx.drawImage(imgScaled, 0, 0);

    return outCn.toDataURL("image/webp", 0.92);
  };

  const removeBackgroundAll = useCallback(async () => {
    if (!frames.length) { alert("Genera frames primero."); return; }
    try {
      setMatting(true); setMatteProgress(0);
      lastMaskRef.current = null; bgLabsRef.current = [];

      const out: string[] = [];
      for (let i = 0; i < frames.length; i++) {
        const url = await runMatte(frames[i], i===0);
        out.push(url);
        setMatteProgress(Math.round(((i + 1) / frames.length) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }
      setFrames(out); setCurrent(0);
    } catch (e) { console.error(e); alert("Segmentación falló. Prueba fondo más uniforme/contrastado o mejor luz."); }
    finally { setMatting(false); }
  }, [frames]);

  const clearVideo = () => {
    if (objUrl) URL.revokeObjectURL(objUrl);
    setObjUrl(""); setFrames([]); setLoaded(false); setDuration(0);
    setProgress(0); setCurrent(0); setMatteProgress(0);
    lastMaskRef.current = null; bgLabsRef.current = [];
  };

  // ===== UI =====
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-6xl mx-auto pt-10">
        <h1 className="text-3xl md:text-4xl font-bold">Create a 360 product from a video</h1>
        <p className="mt-2 text-slate-600">
          Upload a short spin video. We extract <b>{N_FRAMES} frames</b> in the browser and build a 360° viewer with background removal (client-only).
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
                onClick={() => extractFrames(N_FRAMES)}
                className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition disabled:opacity-50 text-sm"
                title={canExtract ? `Extract ${N_FRAMES} frames` : ""}
              >
                {extracting ? "Extracting…" : `Generate ${N_FRAMES} frames`}
              </button>

              <button
                disabled={!frames.length || matting}
                onClick={removeBackgroundAll}
                className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition disabled:opacity-50 text-sm"
                title={!frames.length ? "Generate frames first" : "Remove background"}
              >
                {matting ? `Cleaning… ${matteProgress}%` : "Remove background (beta)"}
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
                  {extracting ? `Extracting… ${progress}%` : `Cleaning background… ${matteProgress}%`}
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
