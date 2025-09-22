"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  spriteSrc: string;
  manifest: { frames: number; cols: number; rows: number; cell: { w: number; h: number } };
  inertia?: number;
  sens?: number;
  zoom?: boolean;
};

export default function Sprite360({
  spriteSrc,
  manifest,
  inertia = 0.94,
  sens = 6,
  zoom = false, // deshabilitado por defecto (UX tipo "silla")
}: Props) {
  const { frames, cols, cell } = manifest;
  const [idx, setIdx] = useState(0);
  const [drag, setDrag] = useState(false);
  const vx = useRef(0);
  const raf = useRef<number | null>(null);
  const autoSpin = useRef(0.25); // velocidad de auto-spin (frames/step)
  const [scale] = useState(1);

  useEffect(() => {
    const loop = () => {
      if (!drag) {
        // Auto-spin suave al estilo e-commerce
        setIdx((i) => (i + autoSpin.current + frames) % frames);
      } else if (Math.abs(vx.current) > 0.01) {
        setIdx((i) => ((i + Math.round(vx.current)) % frames + frames) % frames);
        vx.current *= inertia!;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [frames, inertia, drag]);

  const onDown = (e: React.PointerEvent) => {
    setDrag(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onUp = (e: React.PointerEvent) => {
    setDrag(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const delta = e.movementX / sens!;
    if (delta) {
      setIdx((i) => ((i - Math.trunc(delta)) % frames + frames) % frames);
      vx.current = delta;
    }
  };
  const onWheel = (_e: React.WheelEvent) => {
    // zoom deshabilitado (comportamiento tipo "silla")
    if (!zoom) return;
  };

  const col = Math.floor(idx) % cols;
  const row = Math.floor(idx / cols);
  const bgX = -(col * cell.w);
  const bgY = -(row * cell.h);

  return (
    <div
      className="relative select-none touch-none overflow-hidden border rounded-xl shadow bg-white"
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerMove={onMove}
      onWheel={onWheel}
      style={{
        // tamaño consistente estilo viewer de tienda
        width: Math.min(560, cell.w) * scale,
        height: Math.min(560, cell.h) * scale,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: `url(${spriteSrc})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: `${bgX * scale}px ${bgY * scale}px`,
          backgroundSize: `${cols * cell.w * scale}px auto`,
        }}
      />
      <div className="pointer-events-none absolute bottom-1 right-2 text-[11px] text-slate-600 bg-white/70 px-2 py-0.5 rounded">
        {Math.floor(idx) + 1}/{frames}
      </div>
    </div>
  );
}
