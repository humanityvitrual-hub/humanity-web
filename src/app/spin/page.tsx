"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sprite360 from "@/components/Sprite360";

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

  // sprite result
  const [sprite, setSprite] = useState<string>("");
  const [manifest, setManifest] = useState<{ frames: number; cols: number; rows: number; cell: { w: number; h: number } } | null>(null);

  const [matting, setMatting] = useState(false);
  const [building, setBuilding] = useState(false);

  // cleanup de URL del video
  useEffect(() => {
    return () => {
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [objUrl]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    setFrames([]);
    setSprite("");
    setManifest(null);
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

  const extractFrames = useCallback(async () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || !duration) return;

    try {
      v.muted = true;
      await v.play();
      v.pause();
    } catch {}

    const vw = v.videoWidth;
    const vh = v.videoHeight;
    if (!vw || !vh) return;

    const side = Math.min(vw, vh);
    const sx = (vw - side) / 2;
    const sy = (vh - side) / 2;

    c.width = TARGET_SIZE;
    c.height = TARGET_SIZE;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    setExtracting(true);
    setProgress(0);

    const urls: string[] = [];
    const dt = duration / N_FRAMES;

    for (let i = 0; i < N_FRAMES; i++) {
      const t = i * dt;
      await seekTo(v, t);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(v, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);

      // data URL (no blob:)
      const dataUrl = c.toDataURL("image/webp", 0.92);
      urls.push(dataUrl);
      setProgress(Math.round(((i + 1) / N_FRAMES) * 100));
      await new Promise((r) => setTimeout(r, 0));
    }

    setFrames(urls);
    setCurrent(0);
    setExtracting(false);
  }, [duration]);

  // visor 360 básico para previsualización
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
    setObjUrl("");
    setFrames([]);
    setSprite("");
    setManifest(null);
    setLoaded(false);
    setDuration(0);
    setProgress(0);
    setCurrent(0);
  };

  // sprite 6x6 en cliente (sobre fondo blanco)
  // ---- helpers: trim & normalize frames (centering & scale) ----
  const colorDist = (r,g,b,R,G,B) => Math.hypot(r-R,g-G,b-B);
  const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src;
  });

  // Calcula bbox del sujeto comparando con color del fondo (toma esquina sup-izq)
  const bboxFromBG = (im: HTMLImageElement, tol = 35) => {
    const c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
    const ctx = c.getContext("2d")!; ctx.drawImage(im, 0, 0);
    const { data, width, height } = ctx.getImageData(0,0,c.width,c.height);
    const idx = (x:number,y:number)=>((y*width+x)<<2);
    const R0 = data[idx(0,0)], G0 = data[idx(0,0)+1], B0 = data[idx(0,0)+2];
    let minX=width, minY=height, maxX=-1, maxY=-1;
    for(let y=0;y<height;y++){
      for(let x=0;x<width;x++){
        const i = idx(x,y); const r=data[i], g=data[i+1], b=data[i+2];
        if(colorDist(r,g,b,R0,G0,B0) > tol){
          if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y;
        }
      }
    }
    if(maxX<0) return {x:0,y:0,w:width,h:height};
    return {x:minX, y:minY, w:Math.max(1,maxX-minX+1), h:Math.max(1,maxY-minY+1)};
  };

  // Normaliza: usa bbox union de todos los frames y paddings; devuelve imágenes recortadas centradas cuadradas
  const normalizeFrames = async (srcs: string[], pad = 0.06) => {
    const ims = await Promise.all(srcs.map(loadImg));
    // union de bboxes (consistente entre frames)
    let U = {x:Infinity, y:Infinity, w:0, h:0};
    let maxW = 0, maxH = 0;
    const boxes = ims.map(im=>{
      const b = bboxFromBG(im);
      if(b.x < U.x) U.x = b.x; if(b.y < U.y) U.y = b.y;
      if(b.x+b.w > U.w) U.w = b.x+b.w; if(b.y+b.h > U.h) U.h = b.y+b.h;
      if(im.width>maxW) maxW=im.width; if(im.height>maxH) maxH=im.height;
      return b;
    });
    // pasar a width/height reales
    U.w = Math.min(maxW, Math.max(1, U.w - Math.min(U.x,0)));
    U.h = Math.min(maxH, Math.max(1, U.h - Math.min(U.y,0)));
    // padding y cuadrado
    const side = Math.round(Math.max(U.w, U.h) * (1+pad*2));
    const out = ims.map((im,i)=>{
      const cn = document.createElement("canvas"); cn.width = side; cn.height = side;
      const cx = cn.getContext("2d")!; cx.fillStyle = "#ffffff"; cx.fillRect(0,0,side,side);
      const b = boxes[i];
      const scale = Math.min(side/(U.w*(1+pad*2)), side/(U.h*(1+pad*2)));
      const dstW = Math.round(im.width*scale);
      const dstH = Math.round(im.height*scale);
      const dx = Math.round((side - dstW)/2 - U.x*scale);
      const dy = Math.round((side - dstH)/2 - U.y*scale);
      cx.imageSmoothingQuality = "high";
      cx.drawImage(im, 0, 0, im.width, im.height, dx, dy, dstW, dstH);
      return cn.toDataURL("image/webp", 0.92);
    });
    return {frames: out, cell: side};
  };
  // ---- end helpers ----\n
  const buildSpriteClient = async () => {
    if (frames.length !== 36) return;
    setBuilding(true);
    try {
      const tile = 6;
      // cargar imágenes
      const imgs = await Promise.all(
        frames.map(
          (src) =>
            new Promise<HTMLImageElement>((res, rej) => {
              const im = new Image();
              im.onload = () => res(im);
              im.onerror = rej;
              im.src = src;
            })
        )
      );
      const size = Math.min(imgs[0].width, imgs[0].height);
      const sheetW = size * tile;
      const sheetH = size * tile;
      const cnv = document.createElement("canvas");
      cnv.width = sheetW;
      cnv.height = sheetH;
      const ctx2 = cnv.getContext("2d");
      if (!ctx2) return;

      // fondo blanco tipo e-commerce
      ctx2.fillStyle = "#ffffff";
      ctx2.fillRect(0, 0, sheetW, sheetH);

      imgs.forEach((im, i) => {
        const r = Math.floor(i / tile);
        const c = i % tile;
        ctx2.drawImage(im, 0, 0, size, size, c * size, r * size, size, size);
      });

      const spriteDataUrl = cnv.toDataURL("image/webp", 0.9);
      console.log("SPRITE_BUILT",{tile, size, sheetW, sheetH, urlLen: spriteDataUrl.length});
      setSprite(spriteDataUrl);
      setManifest({ frames: 36, cols: tile, rows: tile, cell: { w: size, h: size } });
    } finally {
      setBuilding(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-6xl mx-auto pt-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Create a 360 product from a video</h1>
        <p className="mt-2 text-slate-600">
          Upload a short spin video (8–12s). We extract <b>36 frames</b> and build a 6×6 sprite for a fast e-commerce viewer.
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

              {!!frames.length && !sprite && (
                <button
                  disabled={building}
                  onClick={buildSpriteClient}
                  className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition text-sm"
                >
                  {building ? "Building…" : "Build sprite 6×6"}
                </button>
              )}

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
            {!frames.length && !sprite ? (
              <div className="aspect-square grid place-items-center text-slate-500">
                <p>When frames are ready, the viewer appears here.</p>
              </div>
            ) : sprite ? (
              <div>
              <Sprite360 src={sprite} manifest={manifest!} />
              <div className="mt-2 text-xs text-slate-600">debug → frames: {manifest?.frames} • grid: {manifest?.cols}×{manifest?.rows} • cell: {manifest?.cell.w}×{manifest?.cell.h}</div>
              <img src={sprite} alt="sprite raw" className="mt-2 w-full border rounded" />
            </div>
            ) : (
              <div
                className="select-none touch-none"
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onPointerMove={onPointerMove}
              >
                <img
                  src={frames[current]}
                  alt={`frame-${current}`}
                  draggable={false}
                  className="w-full h-auto rounded-lg"
                />
                <div className="text-center mt-2 text-xs text-slate-500">
                  Drag horizontally to rotate • {current + 1}/{frames.length}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* canvas oculto para extraer frames */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}
