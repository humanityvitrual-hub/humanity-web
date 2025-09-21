"use client";

import { useEffect, useRef, useState } from "react";

export default function SpinVideoPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [objUrl, setObjUrl] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [duration, setDuration] = useState(0);

  // Limpieza del objectURL anterior
  useEffect(() => {
    return () => {
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [objUrl]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    const url = URL.createObjectURL(f);
    setObjUrl(url);
    setLoaded(false);
  };

  const onLoadedMeta = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
    setLoaded(true);
    // Arrancamos pausado para scrub más fluido
    v.pause();
    v.currentTime = 0;
  };

  const seekFromEvent = (ev: React.PointerEvent | PointerEvent) => {
    if (!dragEnabled) return;
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = v.getBoundingClientRect();
    const x = Math.min(Math.max((ev as PointerEvent).clientX - rect.left, 0), rect.width);
    const frac = rect.width ? x / rect.width : 0;
    v.pause();
    v.currentTime = frac * duration;
  };

  const onPointerDown = (ev: React.PointerEvent) => {
    if (!dragEnabled || !loaded) return;
    setIsDragging(true);
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
    seekFromEvent(ev.nativeEvent);
  };

  const onPointerMove = (ev: React.PointerEvent) => {
    if (!isDragging) return;
    seekFromEvent(ev.nativeEvent);
  };

  const onPointerUp = (ev: React.PointerEvent) => {
    setIsDragging(false);
    (ev.target as HTMLElement).releasePointerCapture?.(ev.pointerId);
  };

  const clearVideo = () => {
    if (objUrl) URL.revokeObjectURL(objUrl);
    setObjUrl("");
    setLoaded(false);
    setDuration(0);
    setIsDragging(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-4xl mx-auto pt-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Video spin (local)</h1>
        <p className="mt-2 text-slate-600">
          Carga un video corto (8–12s) de tu producto girando. No se sube a ningún servidor: se procesa localmente en el navegador.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center px-4 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition cursor-pointer">
            <input
              type="file"
              accept="video/*"
              onChange={onPickFile}
              className="sr-only"
            />
            <span>Choose spin video</span>
          </label>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={dragEnabled}
              onChange={(e) => setDragEnabled(e.target.checked)}
            />
            <span>Drag on the video to rotate</span>
          </label>

          {objUrl && (
            <button
              onClick={clearVideo}
              className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow text-sm"
            >
              Reset
            </button>
          )}

          {loaded ? (
            <span className="text-emerald-600 text-sm">Loaded</span>
          ) : objUrl ? (
            <span className="text-slate-500 text-sm">Loading metadata…</span>
          ) : null}
        </div>

        <div className="mt-6 rounded-xl border bg-white/70 backdrop-blur p-3 shadow">
          {!objUrl ? (
            <div className="aspect-video grid place-items-center text-slate-500">
              <p>Pick a <strong>video</strong> to start.</p>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                src={objUrl}
                className="w-full max-h-[70vh] rounded-lg"
                playsInline
                muted
                controls
                onLoadedMetadata={onLoadedMeta}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              />
              {dragEnabled && (
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="inline-block text-xs px-2 py-1 rounded-md bg-white/80 border shadow">
                    Tip: drag horizontally on the video to rotate
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Nota: la rotación por arrastre funciona localmente. Para convertir a sprites/frames y guardarlo como producto 360,
          más adelante lo conectamos con tu flujo de “Create shop”.
        </p>
      </div>
    </main>
  );
}
