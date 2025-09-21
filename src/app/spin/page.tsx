'use client';
import { useRef, useState, useEffect } from 'react';

export default function SpinPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(true);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startT, setStartT] = useState(0);
  const [duration, setDuration] = useState(0);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !videoRef.current) return;
    const url = URL.createObjectURL(f);
    const v = videoRef.current;
    v.src = url;
    v.currentTime = 0;
    v.pause();
    setLoaded(true);
  };

  const onLoadedMeta = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
  };

  const getX = (e: React.PointerEvent | React.TouchEvent) => {
    // Soporta mouse y touch
    // @ts-ignore
    const t = e.touches?.[0];
    return (t?.clientX ?? (e as any).clientX) as number;
  };

  const pointerDown = (e: any) => {
    if (!dragEnabled || !videoRef.current) return;
    const v = videoRef.current;
    v.pause();
    setIsDown(true);
    setStartX(getX(e));
    setStartT(v.currentTime);
  };

  const pointerMove = (e: any) => {
    if (!dragEnabled || !isDown || !videoRef.current) return;
    const v = videoRef.current;
    const x = getX(e);
    const dx = x - startX;
    const w = v.clientWidth || 1;
    const frac = dx / w; // desplazamiento horizontal → % del video
    const newT = Math.min(Math.max(startT + frac * duration, 0), duration);
    v.currentTime = newT;
  };

  const pointerUp = () => setIsDown(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.addEventListener('loadedmetadata', onLoadedMeta);
    return () => v.removeEventListener('loadedmetadata', onLoadedMeta);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-4xl mx-auto pt-10">
        <h1 className="text-3xl font-bold tracking-tight">Video spin (beta)</h1>
        <p className="mt-2 text-slate-600">
          Upload a short product spin video (8–12s). Pause and <b>drag on the video</b> to rotate.
          This is 100% client-side (safe in Vercel Preview).
        </p>

        <div className="mt-4 flex items-center gap-4">
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            onChange={onFile}
            className="block text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={dragEnabled}
              onChange={(e) => setDragEnabled(e.target.checked)}
            />
            Enable drag
          </label>
        </div>

        <div className="mt-6 rounded-xl border bg-white/70 backdrop-blur p-3 shadow">
          <div
            className="relative mx-auto w-full max-w-3xl select-none"
            onMouseDown={pointerDown}
            onMouseMove={pointerMove}
            onMouseUp={pointerUp}
            onMouseLeave={pointerUp}
            onTouchStart={pointerDown}
            onTouchMove={pointerMove}
            onTouchEnd={pointerUp}
          >
            <video
              ref={videoRef}
              className="w-full rounded-lg"
              controls
              playsInline
              preload="auto"
            />
          </div>

          {!loaded && (
            <p className="text-sm text-slate-500 p-3">
              Pick an <code>.mp4</code> / <code>.mov</code> file to start.
            </p>
          )}
          {loaded && (
            <div className="text-xs text-slate-500 p-3">
              Duration: {duration.toFixed(2)}s • Tip: pause and drag to scrub.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
