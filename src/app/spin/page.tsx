"use client";
"use client";


import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sprite360 from "@/components/Sprite360";
import Sprite360 from "@/components/Sprite360";


export default function SpinVideoPage() {
export default function SpinVideoPage() {
  const N_FRAMES = 36;
  const N_FRAMES = 36;
  const TARGET_SIZE = 640;
  const TARGET_SIZE = 640;


  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);


  const [objUrl, setObjUrl] = useState<string>("");
  const [objUrl, setObjUrl] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [duration, setDuration] = useState(0);


  const [extracting, setExtracting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [frames, setFrames] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragging, setDragging] = useState(false);


  // sprite result
  // sprite result
  const [sprite, setSprite] = useState<string>("");
  const [sprite, setSprite] = useState<string>("");
  const [manifest, setManifest] = useState<{ frames: number; cols: number; rows: number; cell: { w: number; h: number } } | null>(null);
  const [manifest, setManifest] = useState<{ frames: number; cols: number; rows: number; cell: { w: number; h: number } } | null>(null);
  const [matting, setMatting] = useState(false);
  const [matting, setMatting] = useState(false);
  const [building, setBuilding] = useState(false);
  const [building, setBuilding] = useState(false);


  useEffect(() => {
  useEffect(() => {
    return () => {
    return () => {
      if (objUrl) URL.revokeObjectURL(objUrl);
      if (objUrl) URL.revokeObjectURL(objUrl);
      // data URLs – no revoke needed
      // data URLs – no revoke needed
    };
    };
  }, [objUrl]);
  }, [objUrl]);
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    if (objUrl) URL.revokeObjectURL(objUrl);
    // data URLs – no revoke needed
    // data URLs – no revoke needed
    setFrames([]);
    setFrames([]);
    setSprite("");
    setSprite("");
    setManifest(null);
    setManifest(null);
    setCurrent(0);
    setCurrent(0);
    const url = URL.createObjectURL(f);
    const url = URL.createObjectURL(f);
    setObjUrl(url);
    setObjUrl(url);
    setLoaded(false);
    setLoaded(false);
  };
  };


  const onLoadedMeta = () => {
  const onLoadedMeta = () => {
    const v = videoRef.current;
    const v = videoRef.current;
    if (!v) return;
    if (!v) return;
    setDuration(v.duration || 0);
    setDuration(v.duration || 0);
    setLoaded(true);
    setLoaded(true);
    v.pause();
    v.pause();
    v.currentTime = 0;
    v.currentTime = 0;
  };
  };


  const seekTo = (v: HTMLVideoElement, t: number) =>
  const seekTo = (v: HTMLVideoElement, t: number) =>
    new Promise<void>((resolve) => {
    new Promise<void>((resolve) => {
      const onSeek = () => {
      const onSeek = () => {
        v.removeEventListener("seeked", onSeek);
        v.removeEventListener("seeked", onSeek);
        resolve();
        resolve();
      };
      };
      v.addEventListener("seeked", onSeek, { once: true });
      v.addEventListener("seeked", onSeek, { once: true });
      v.currentTime = Math.min(Math.max(t, 0), v.duration || 0);
      v.currentTime = Math.min(Math.max(t, 0), v.duration || 0);
    });
    });


  const extractFrames = useCallback(async () => {
  const extractFrames = useCallback(async () => {
    const v = videoRef.current;
    const v = videoRef.current;
    const c = canvasRef.current;
    const c = canvasRef.current;
    if (!v || !c || !duration) return;
    if (!v || !c || !duration) return;


    try {
    try {
      v.muted = true;
      v.muted = true;
      await v.play();
      await v.play();
      v.pause();
      v.pause();
    } catch {}
    } catch {}


    const vw = v.videoWidth;
    const vw = v.videoWidth;
    const vh = v.videoHeight;
    const vh = v.videoHeight;
    if (!vw || !vh) return;
    if (!vw || !vh) return;


    const side = Math.min(vw, vh);
    const side = Math.min(vw, vh);
    const sx = (vw - side) / 2;
    const sx = (vw - side) / 2;
    const sy = (vh - side) / 2;
    const sy = (vh - side) / 2;


    c.width = TARGET_SIZE;
    c.width = TARGET_SIZE;
    c.height = TARGET_SIZE;
    c.height = TARGET_SIZE;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    if (!ctx) return;


    setExtracting(true);
    setExtracting(true);
    setProgress(0);
    setProgress(0);


    // data URLs – no revoke needed
    // data URLs – no revoke needed
    const urls: string[] = [];
    const urls: string[] = [];


    const dt = duration / N_FRAMES;
    const dt = duration / N_FRAMES;
    for (let i = 0; i < N_FRAMES; i++) {
    for (let i = 0; i < N_FRAMES; i++) {
      const t = i * dt;
      const t = i * dt;
      await seekTo(v, t);
      await seekTo(v, t);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(v, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);
      ctx.drawImage(v, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);


      const dataUrl = c.toDataURL("image/webp", 0.92);
      const dataUrl = c.toDataURL("image/webp", 0.92);
      urls.push(dataUrl);
      urls.push(dataUrl);
      setProgress(Math.round(((i + 1) / N_FRAMES) * 100));
      setProgress(Math.round(((i + 1) / N_FRAMES) * 100));
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
    }
    }


    setFrames(urls);
    setFrames(urls);
    setCurrent(0);
    setCurrent(0);
    setExtracting(false);
    setExtracting(false);
  }, [duration, frames]);
  }, [duration, frames]);


  // viewer (old behavior kept for preview)
  // viewer (old behavior kept for preview)
  const onPointerDown = (ev: React.PointerEvent) => {
  const onPointerDown = (ev: React.PointerEvent) => {
    if (!frames.length) return;
    if (!frames.length) return;
    setDragging(true);
    setDragging(true);
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
  };
  };
  const onPointerUp = (ev: React.PointerEvent) => {
  const onPointerUp = (ev: React.PointerEvent) => {
    setDragging(false);
    setDragging(false);
    (ev.target as HTMLElement).releasePointerCapture?.(ev.pointerId);
    (ev.target as HTMLElement).releasePointerCapture?.(ev.pointerId);
  };
  };
  const onPointerMove = (ev: React.PointerEvent) => {
  const onPointerMove = (ev: React.PointerEvent) => {
    if (!dragging || !frames.length) return;
    if (!dragging || !frames.length) return;
    const SENS = 6;
    const SENS = 6;
    const delta = Math.trunc(ev.movementX / SENS);
    const delta = Math.trunc(ev.movementX / SENS);
    if (delta !== 0) {
    if (delta !== 0) {
      setCurrent((i) => {
      setCurrent((i) => {
        let n = (i - delta) % frames.length;
        let n = (i - delta) % frames.length;
        if (n < 0) n += frames.length;
        if (n < 0) n += frames.length;
        return n;
        return n;
      });
      });
    }
    }
  };
  };


  const canExtract = useMemo(() => loaded && objUrl && !extracting, [loaded, objUrl, extracting]);
  const canExtract = useMemo(() => loaded && objUrl && !extracting, [loaded, objUrl, extracting]);


  const clearVideo = () => {
  const clearVideo = () => {
    if (objUrl) URL.revokeObjectURL(objUrl);
    if (objUrl) URL.revokeObjectURL(objUrl);
    // data URLs – no revoke needed
    // data URLs – no revoke needed
    setObjUrl("");
    setObjUrl("");
    setFrames([]);
    setFrames([]);
    setSprite("");
    setSprite("");
    setManifest(null);
    setManifest(null);
    setLoaded(false);
    setLoaded(false);
    setDuration(0);
    setDuration(0);
    setProgress(0);
    setProgress(0);
    setCurrent(0);
    setCurrent(0);
  };
  };


  const buildSprite = async () => {
  const buildSprite = async () => {
    if (frames.length !== 36) return;
    if (frames.length !== 36) return;
    const res = await fetch("/api/sprite", {
    const res = await fetch("/api/sprite", {
      method: "POST",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frames, background: "white", tile: 6 }),
      body: JSON.stringify({ frames, background: "white", tile: 6 }),
    });
    });
    const data = await res.json();
    const data = await res.json();
    if (data?.sprite && data?.manifest) {
    if (data?.sprite && data?.manifest) {
      setSprite(data.sprite);
      setSprite(data.sprite);
      setManifest(data.manifest);
      setManifest(data.manifest);
    } else {
    } else {
      console.error("sprite error", data);
      console.error("sprite error", data);
    }
    }
  };
  };


  const buildSpriteClient = async () => {
  const buildSpriteClient = async () => {
    if (frames.length !== 36) return;
    if (frames.length !== 36) return;
    const tile = 6;
    const tile = 6;
    // Cargar imagenes en memoria
    // Cargar imagenes en memoria
    const imgs = await Promise.all(frames.map(src => new Promise((res, rej) => {
    const imgs = await Promise.all(frames.map(src => new Promise((res, rej) => {
      const im = new Image();
      const im = new Image();
      im.onload = () => res(im);
      im.onload = () => res(im);
      im.onerror = rej;
      im.onerror = rej;
      im.src = src;
      im.src = src;
    })));
    })));
    const size = Math.min(imgs[0].width, imgs[0].height);
    const size = Math.min(imgs[0].width, imgs[0].height);
    const sheetW = size * tile;
    const sheetW = size * tile;
    const sheetH = size * tile;
    const sheetH = size * tile;
    const cnv = document.createElement("canvas");
    const cnv = document.createElement("canvas");
    cnv.width = sheetW;
    cnv.width = sheetW;
    cnv.height = sheetH;
    cnv.height = sheetH;
    const ctx2 = cnv.getContext("2d");
    const ctx2 = cnv.getContext("2d");
    if(!ctx2) return;
    if(!ctx2) return;
    // Fondo blanco (look e-commerce)
    // Fondo blanco (look e-commerce)
    ctx2.fillStyle = "#ffffff";
    ctx2.fillStyle = "#ffffff";
    ctx2.fillRect(0, 0, sheetW, sheetH);
    ctx2.fillRect(0, 0, sheetW, sheetH);
    imgs.forEach((im, i) => {
    imgs.forEach((im, i) => {
      const r = Math.floor(i / tile);
      const r = Math.floor(i / tile);
      const c = i % tile;
      const c = i % tile;
      ctx2.drawImage(im, 0, 0, size, size, c * size, r * size, size, size);
      ctx2.drawImage(im, 0, 0, size, size, c * size, r * size, size, size);
    });
    });
    const spriteDataUrl = cnv.toDataURL("image/webp", 0.9);
    const spriteDataUrl = cnv.toDataURL("image/webp", 0.9);
    setSprite(spriteDataUrl);
    setSprite(spriteDataUrl);
    setManifest({ frames: 36, cols: tile, rows: tile, cell: { w: size, h: size } });
    setManifest({ frames: 36, cols: tile, rows: tile, cell: { w: size, h: size } });
  };
  };
  return (
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-6xl mx-auto pt-10">
      <div className="max-w-6xl mx-auto pt-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Create a 360 product from a video</h1>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Create a 360 product from a video</h1>
        <p className="mt-2 text-slate-600">
        <p className="mt-2 text-slate-600">
          Upload a short spin video (8–12s). We extract <b>36 frames</b> in the browser and build a 360° viewer (drag to rotate).
          Upload a short spin video (8–12s). We extract <b>36 frames</b> in the browser and build a 360° viewer (drag to rotate).
          Then we pack a <b>6×6 sprite</b> for a fast e-commerce viewer. This is <b>Preview-only</b>; no backend uploads.
          Then we pack a <b>6×6 sprite</b> for a fast e-commerce viewer. This is <b>Preview-only</b>; no backend uploads.
        </p>
        </p>


        <div className="mt-6 flex flex-wrap gap-3 items-center">
        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center px-4 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition cursor-pointer">
          <label className="inline-flex items-center px-4 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition cursor-pointer">
            <input type="file" accept="video/*" onChange={onPickFile} className="sr-only" />
            <input type="file" accept="video/*" onChange={onPickFile} className="sr-only" />
            <span>Choose spin video</span>
            <span>Choose spin video</span>
          </label>
          </label>
                <button
                <button
                  disabled={!canExtract}
                  disabled={!canExtract}
                  onClick={extractFrames}
                  onClick={extractFrames}
                  className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition disabled:opacity-50 text-sm"
                  className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition disabled:opacity-50 text-sm"
                  title={canExtract ? "Extract 36 frames" : ""}
                  title={canExtract ? "Extract 36 frames" : ""}
                >
                >
                  {extracting ? "Extracting…" : "Generate 36 frames"}
                  {extracting ? "Extracting…" : "Generate 36 frames"}
                </button>
                </button>


                <button
                <button
                  disabled={!frames.length || matting}
                  disabled={!frames.length || matting}
                  onClick={async () => {
                  onClick={async () => {
                    if (!frames.length || matting) return;
                    if (!frames.length || matting) return;
                    try {
                    try {
                      setMatting(true);
                      setMatting(true);
                      const res = await fetch("/api/matte", {
                      const res = await fetch("/api/matte", {
                        method: "POST",
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ frames })
                        body: JSON.stringify({ frames })
                      });
                      });
                      const data = await res.json();
                      const data = await res.json();
                      if (data?.frames?.length) setFrames(data.frames);
                      if (data?.frames?.length) setFrames(data.frames);
                    } catch (e) {
                    } catch (e) {
                      console.error(e);
                      console.error(e);
                      alert("Matting error: " + e);
                      alert("Matting error: " + e);
                    } finally {
                    } finally {
                      setMatting(false);
                      setMatting(false);
                    }
                    }
                  }}
                  }}
                  className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition text-sm"
                  className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition text-sm"
                >
                >
                  {matting ? "Removing background…" : "Remove background"}
                  {matting ? "Removing background…" : "Remove background"}
                </button>
                </button>


                <button
                <button
                  onClick={clearVideo}
                  onClick={clearVideo}
                  className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition text-sm"
                  className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition text-sm"
                >
                >
                  Reset
                  Reset
                </button>
                </button>
                {!!frames.length && !sprite && (
                <button
                  onClick={buildSpriteClient}
                  className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition text-sm"
                >
                  Build sprite 6×6
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
            ) : sprite && manifest ? (
              <Sprite360 spriteSrc={sprite} manifest={manifest} inertia={0.92} sens={6} zoom />
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

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}
