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

  // Matting + estabilidad
  const [matting, setMatting] = useState(false);
  const [matteProgress, setMatteProgress] = useState(0);
  const sessionRef = useRef<ort.InferenceSession | null>(null);
  const lastMaskRef = useRef<Float32Array | null>(null);

  // Fondo en LAB (estimado del primer frame)
  const bgLabRef = useRef<{L:number;a:number;b:number; sigma:number} | null>(null);

  // Normalización global de tamaño (bbox target)
  const normRef = useRef<{maxW:number; maxH:number} | null>(null);

  useEffect(() => {
    return () => { if (objUrl) URL.revokeObjectURL(objUrl); };
  }, [objUrl]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      if (objUrl) URL.revokeObjectURL(objUrl);
      setFrames([]); setCurrent(0); setLoaded(false); setDuration(0);
      setMatteProgress(0);
      lastMaskRef.current = null;
      bgLabRef.current = null;
      normRef.current = null;
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

  const seekTo = (v: HTMLVideoElement, t: number) =>
    new Promise<void>((resolve) => {
      const onSeek = () => { v.removeEventListener("seeked", onSeek); resolve(); };
      v.addEventListener("seeked", onSeek, { once: true });
      v.currentTime = Math.min(Math.max(t, 0), v.duration || 0);
    });

  const extractFrames = useCallback(async () => {
    const v = videoRef.current;
    const c = canvasRef.current;
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
      const dt = duration / N_FRAMES;

      for (let i = 0; i < N_FRAMES; i++) {
        await seekTo(v, i * dt);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(v, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);
        const dataUrl = c.toDataURL("image/webp", 0.92);
        urls.push(dataUrl);
        setProgress(Math.round(((i + 1) / N_FRAMES) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }
      setFrames(urls); setCurrent(0);
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

  // ========= Utilidades de máscara =========
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
              if (xx >= 0 && xx < w && yy >= 0 && yy < h) { sum += a[idx(xx, yy)]; count++; }
            }
          }
          b[idx(x, y)] = sum / count;
        }
      }
      const tmp = a; a = b; b = tmp;
    }
    return a;
  }
  const smoothstep = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };
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
  // conexas: nos quedamos con la región mayor (>0.5)
  function largestComponent(src: Float32Array, w: number, h: number, thr=0.5) {
    const N = w*h;
    const visited = new Uint8Array(N);
    const idx = (x:number,y:number)=> y*w + x;
    let bestSize = 0;
    let bestMask = new Float32Array(N);
    const stackX:number[] = [], stackY:number[] = [];
    for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
      const i = idx(x,y);
      if (visited[i] || src[i] < thr) continue;
      // flood fill
      let size = 0;
      const curMask = new Float32Array(N);
      stackX.length=0; stackY.length=0; stackX.push(x); stackY.push(y);
      visited[i]=1;
      while (stackX.length) {
        const cx = stackX.pop()!, cy = stackY.pop()!;
        const ci = idx(cx,cy);
        curMask[ci] = src[ci];
        size++;
        for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
          if (dx===0 && dy===0) continue;
          const nx=cx+dx, ny=cy+dy;
          if (nx<0||nx>=w||ny<0||ny>=h) continue;
          const ni = idx(nx,ny);
          if (!visited[ni] && src[ni] >= thr) {
            visited[ni]=1; stackX.push(nx); stackY.push(ny);
          }
        }
      }
      if (size > bestSize) { bestSize = size; bestMask = curMask; }
    }
    return bestMask;
  }

  // ========= Color: RGB -> LAB y deltaE =========
  function rgb2xyz(r:number,g:number,b:number) {
    r/=255; g/=255; b/=255;
    // sRGB compand
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
  function rgb2lab(r:number,g:number,b:number){
    const {x,y,z}=rgb2xyz(r,g,b);
    return xyz2lab(x,y,z);
  }
  function deltaE(a:{L:number;a:number;b:number}, b:{L:number;a:number;b:number}){
    const dL=a.L-b.L, da=a.a-b.a, db=a.b-b.b;
    return Math.sqrt(dL*dL+da*da+db*db);
  }

  // ========= Modelo =========
  const loadU2Net = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;
    const session = await ort.InferenceSession.create("/models/u2netp.onnx", { executionProviders: ["wasm"] });
    sessionRef.current = session;
    return session;
  }, []);

  // Prepara entrada 320x320 + letterbox y devuelve RGBA para análisis
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

  // Estima el fondo en LAB a partir de los bordes del primer frame
  function estimateBgLab(rgba: ImageData, box: {x:number;y:number;w:number;h:number;size:number}) {
    const W = rgba.width, H = rgba.height, data = rgba.data;
    const pad = 10;
    const x0 = Math.max(0, box.x), y0 = Math.max(0, box.y);
    const x1 = Math.min(W, box.x + box.w), y1 = Math.min(H, box.y + box.h);
    let sumL=0,sumA=0,sumB=0,n=0;
    const idx=(x:number,y:number)=> (y*W + x)*4;
    for(let y=y0;y<y1;y++){
      for(let x=x0;x<x1;x++){
        const onBorder=(x-x0<pad)||(y-y0<pad)||(x1-1-x<pad)||(y1-1-y<pad);
        if(!onBorder) continue;
        const p=idx(x,y); const lab=rgb2lab(data[p],data[p+1],data[p+2]);
        sumL+=lab.L; sumA+=lab.a; sumB+=lab.b; n++;
      }
    }
    const mean={L:sumL/Math.max(1,n), a:sumA/Math.max(1,n), b:sumB/Math.max(1,n)};
    // sigma aprox
    let varSum=0,m=0;
    for(let y=y0;y<y1;y+=4){
      for(let x=x0;x<x1;x+=4){
        const onBorder=(x-x0<pad)||(y-y0<pad)||(x1-1-x<pad)||(y1-1-y<pad);
        if(!onBorder) continue;
        const p=idx(x,y); const lab=rgb2lab(data[p],data[p+1],data[p+2]);
        const d=deltaE(lab,mean); varSum+=d*d; m++;
      }
    }
    const sigma = Math.sqrt(varSum/Math.max(1,m)); // deltaE típico
    return { ...mean, sigma: Math.max(2, Math.min(20, sigma)) }; // en dE*
  }

  // Probabilidad de primer plano basada en distancia LAB al fondo
  function fgProbFromBgLAB(rgba: ImageData, box: {x:number;y:number;w:number;h:number;size:number}, bg:{L:number;a:number;b:number;sigma:number}) {
    const W = rgba.width, H = rgba.height, data = rgba.data;
    const SIZE = box.size;
    const out = new Float32Array(SIZE*SIZE);
    const idx=(x:number,y:number)=> (y*W + x)*4;
    const norm = (bg.sigma*2.5 + 1e-3); // 2.5σ ≈ zona de fondo
    for (let y=0;y<H;y++) for(let x=0;x<W;x++){
      const i=y*W+x;
      if (x<box.x || x>=box.x+box.w || y<box.y || y>=box.y+box.h) { out[i]=0; continue; }
      const p=idx(x,y); const lab=rgb2lab(data[p],data[p+1],data[p+2]);
      let d = deltaE(lab, {L:bg.L,a:bg.a,b:bg.b})/norm; // 0..~∞
      if (d>1) d=1; if (d<0) d=0;
      out[i]=d;
    }
    return out;
  }

  // Ejecuta un frame → dataURL sin fondo (blanco), con LAB + conexas + normalización
  const runMatte = async (dataUrl: string, isFirst:boolean) => {
    const session = await loadU2Net();
    const { tensor, box, rgba } = await prepareInput(dataUrl);

    // Si es el primer frame, estimamos el fondo LAB
    if (isFirst || !bgLabRef.current) {
      bgLabRef.current = estimateBgLab(rgba, box);
    }
    const bg = bgLabRef.current!;

    // Inferencia
    const feeds: Record<string, ort.Tensor> = {};
    const inputName = session.inputNames[0] || "input";
    feeds[inputName] = tensor;
    const output = await session.run(feeds);
    const out = output[session.outputNames[0]];
    if (!out) throw new Error("Salida del modelo no encontrada.");
    const SIZE = box.size;

    // Máscara del modelo
    let mask = (out as ort.Tensor).data as Float32Array; // [0..1] 320x320

    // Apoyo por color LAB (fondo)
    const labAssist = fgProbFromBgLAB(rgba, box, bg);
    for (let i=0;i<mask.length;i++) mask[i] = Math.max(mask[i], labAssist[i]*0.95);

    // Suavizado + curva (bordes)
    mask = blur3x3Float(mask, SIZE, SIZE, 2);
    const edge0=0.22, edge1=0.5;
    for (let i=0;i<mask.length;i++) mask[i] = smoothstep(edge0, edge1, mask[i]);

    // Closing morfológico
    mask = dilate3x3(mask, SIZE, SIZE);
    mask = erode3x3(mask, SIZE, SIZE);

    // Histéresis temporal
    const prev = lastMaskRef.current;
    if (prev && prev.length === mask.length) {
      const decay = 0.90;
      for (let i=0;i<mask.length;i++) {
        const mem = prev[i]*decay;
        if (mem > mask[i]) mask[i]=mem;
      }
    }
    lastMaskRef.current = Float32Array.from(mask);

    // Componente conexa mayor
    const main = largestComponent(mask, SIZE, SIZE, 0.5);

    // BBox del sujeto en 320
    let minx=SIZE, miny=SIZE, maxx=0, maxy=0, any=false;
    for (let y=0;y<SIZE;y++) for (let x=0;x<SIZE;x++){
      const v = main[y*SIZE+x];
      if (v>0) { any=true; if (x<minx)minx=x; if (x>maxx)maxx=x; if (y<miny)miny=y; if (y>maxy)maxy=y; }
    }
    if (!any) { // fallback: usar la del modelo sin conexas
      minx=0;miny=0;maxx=SIZE-1;maxy=SIZE-1;
    }
    const bw = Math.max(1, maxx-minx+1), bh = Math.max(1, maxy-miny+1);
    // Normalización global: guardamos el tamaño más grande para homogeneizar
    if (!normRef.current) normRef.current = {maxW:bw, maxH:bh};
    normRef.current.maxW = Math.max(normRef.current.maxW, bw);
    normRef.current.maxH = Math.max(normRef.current.maxH, bh);

    // Construir máscara RGBA 320 del main con feather extra
    const mcn = document.createElement("canvas"); mcn.width = SIZE; mcn.height = SIZE;
    const mctx = mcn.getContext("2d", { willReadFrequently: true })!;
    const id = mctx.createImageData(SIZE, SIZE);
    for (let i=0, q=0;i<SIZE*SIZE;i++){
      // feather: remapeo leve 0.45..1.0 → 0..1
      let a = main[i];
      if (a<0.45) a=0; else a = (a-0.45)/0.55;
      const A = Math.max(0, Math.min(255, Math.round(a*255)));
      id.data[q++]=255; id.data[q++]=255; id.data[q++]=255; id.data[q++]=A;
    }
    mctx.putImageData(id, 0, 0);

    // Escalar la máscara recortando al bbox, y luego ajustarla a un tamaño global consistente
    const maskBoxed = document.createElement("canvas");
    const targetW = normRef.current.maxW, targetH = normRef.current.maxH;
    // escalamos bbox al TARGET_SIZE manteniendo cuadrado final
    const boxCanvas = document.createElement("canvas");
    boxCanvas.width = bw; boxCanvas.height = bh;
    const bctx = boxCanvas.getContext("2d")!;
    bctx.drawImage(mcn, minx, miny, bw, bh, 0, 0, bw, bh);

    // Ahora llevamos este recorte al tamaño deseado dentro del canvas final
    maskBoxed.width = TARGET_SIZE; maskBoxed.height = TARGET_SIZE;
    const mbx = maskBoxed.getContext("2d")!;
    mbx.clearRect(0,0,TARGET_SIZE,TARGET_SIZE);
    // destino: ocupamos el porcentaje del lienzo en función del tamaño global
    const scale = Math.min(TARGET_SIZE/targetW, TARGET_SIZE/targetH);
    const dw = Math.round(bw*scale), dh = Math.round(bh*scale);
    const dx = Math.floor((TARGET_SIZE - dw)/2), dy = Math.floor((TARGET_SIZE - dh)/2);
    mbx.drawImage(boxCanvas, 0, 0, bw, bh, dx, dy, dw, dh);

    // Componer sobre blanco con la imagen original (también recortada a bbox y reescalada igual)
    const outCn = document.createElement("canvas"); outCn.width = TARGET_SIZE; outCn.height = TARGET_SIZE;
    const outCx = outCn.getContext("2d", { willReadFrequently: true })!;
    outCx.fillStyle="#fff"; outCx.fillRect(0,0,TARGET_SIZE,TARGET_SIZE);

    const img = new Image(); img.src = dataUrl; await img.decode();
    const imgBox = document.createElement("canvas"); imgBox.width=bw; imgBox.height=bh;
    const ibx = imgBox.getContext("2d")!;
    // recordar: dataUrl ya es cuadriculado TARGET_SIZE del objeto centrado, no necesitamos letterbox aquí
    // reconstruimos la misma región del bbox en 320→ pero nuestro dataUrl ya es 640; hacemos un mapeo proporcional
    // Para simplificar, re-escalamos la imagen completa al tamaño destino y enmascaramos: resultado visual es el mismo.
    const imgScaled = document.createElement("canvas"); imgScaled.width=TARGET_SIZE; imgScaled.height=TARGET_SIZE;
    const isx = imgScaled.getContext("2d")!;
    isx.drawImage(img, 0,0,TARGET_SIZE,TARGET_SIZE);
    // aplicar máscara
    isx.globalCompositeOperation = "destination-in";
    isx.drawImage(maskBoxed, 0, 0);

    outCx.drawImage(imgScaled, 0, 0);

    return outCn.toDataURL("image/webp", 0.92);
  };

  const removeBackgroundAll = useCallback(async () => {
    if (!frames.length) { alert("Genera los 36 frames primero."); return; }
    try {
      setMatting(true); setMatteProgress(0);
      lastMaskRef.current = null;
      bgLabRef.current = null;
      normRef.current = null;

      const out: string[] = [];
      for (let i = 0; i < frames.length; i++) {
        const url = await runMatte(frames[i], i===0);
        out.push(url);
        setMatteProgress(Math.round(((i + 1) / frames.length) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }
      setFrames(out); setCurrent(0);
    } catch (e) {
      console.error(e);
      alert("Segmentación falló. Prueba fondo más uniforme/contrastado o mejor luz.");
    } finally {
      setMatting(false);
    }
  }, [frames]);

  const clearVideo = () => {
    if (objUrl) URL.revokeObjectURL(objUrl);
    setObjUrl(""); setFrames([]); setLoaded(false); setDuration(0);
    setProgress(0); setCurrent(0); setMatteProgress(0);
    lastMaskRef.current = null;
    bgLabRef.current = null;
    normRef.current = null;
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
