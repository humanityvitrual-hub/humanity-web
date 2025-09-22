"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  spriteSrc: string;
  manifest: { frames: number; cols: number; rows: number; cell: { w: number; h: number } };
  inertia?: number;
  sens?: number;
  zoom?: boolean;
};

export default function Sprite360({ spriteSrc, manifest, inertia = 0.92, sens = 6, zoom = true }: Props) {
  const { frames, cols, cell } = manifest;
  const [idx, setIdx] = useState(0);
  const [drag, setDrag] = useState(false);
  const vx = useRef(0);
  const raf = useRef<number | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const loop = () => {
      if (!drag && Math.abs(vx.current) > 0.01) {
        setIdx(i => ((i + Math.round(vx.current)) % frames + frames) % frames);
        vx.current *= inertia!;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [frames, inertia, drag]);

  const onDown = (e: React.PointerEvent) => { setDrag(true); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); };
  const onUp = (e: React.PointerEvent) => { setDrag(false); (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); };
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const delta = e.movementX / sens!;
    if (delta) {
      setIdx(i => ((i - Math.trunc(delta)) % frames + frames) % frames);
      vx.current = delta;
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!zoom) return;
    e.preventDefault();
    setScale(s => Math.min(3, Math.max(1, s + (e.deltaY < 0 ? 0.1 : -0.1))));
  };

  const col = idx % cols;
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
      style={{ width: cell.w * scale, height: cell.h * scale }}
    >
      <div
        style={{
          width: cell.w * scale,
          height: cell.h * scale,
          backgroundImage: `url(${spriteSrc})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: `${bgX * scale}px ${bgY * scale}px`,
          backgroundSize: `${cols * cell.w * scale}px auto`,
        }}
      />
      <div className="absolute bottom-1 right-2 text-xs text-slate-600 bg-white/70 px-2 py-0.5 rounded">
        {idx + 1}/{frames}
      </div>
    </div>
  );
}
