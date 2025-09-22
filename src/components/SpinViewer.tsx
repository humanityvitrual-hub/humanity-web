// @ts-nocheck
'use client';
import { useEffect, useRef, useState } from 'react';

export default function SpinViewer({ src, poster, autoPlay = true, className = '' }) {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onMeta = () => {
      setDuration(v.duration || 0);
      v.loop = true; v.muted = true;
      if (autoPlay) v.play().catch(() => {});
    };
    v.addEventListener('loadedmetadata', onMeta);
    return () => v.removeEventListener('loadedmetadata', onMeta);
  }, [autoPlay]);

  const getX = (e) => ('clientX' in e ? e.clientX : 0);

  const onDown = (e) => {
    const v = videoRef.current; if (!v || !duration) return;
    setDragging(true);
    startX.current = getX(e);
    startTime.current = v.currentTime || 0;
    v.pause();
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    const v = videoRef.current; if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = getX(e) - startX.current;
    const delta = (dx / Math.max(20, rect.width)) * duration;
    let t = startTime.current + delta;
    t = ((t % duration) + duration) % duration;
    v.currentTime = t;
  };
  const onUp = (e) => {
    if (!dragging) return;
    setDragging(false);
    const v = videoRef.current; if (v && autoPlay) v.play().catch(() => {});
    e?.currentTarget?.releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      className={`relative select-none ${className}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <video ref={videoRef} src={src} poster={poster} playsInline className="w-full h-auto rounded-lg border shadow-sm bg-black/5" />
      <div className="pointer-events-none absolute bottom-2 right-3 text-xs px-2 py-1 rounded-md bg-black/50 text-white">
        Drag to rotate
      </div>
    </div>
  );
}
