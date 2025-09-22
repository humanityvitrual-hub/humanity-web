"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  spriteSrc: string;
  manifest: { frames: number; cols: number; rows: number; cell: { w: number; h: number } };
  inertia?: number;
  sens?: number;
  autoplay?: boolean;   // <— nuevo: auto-spin opcional
  zoom?: boolean;
};

export default function Sprite360({
  spriteSrc,
  manifest,
  inertia = 0.94,
  sens = 6,
  autoplay = false,   // <— por defecto apagado
  zoom = false,
}: Props) {
  const { frames, cols, cell } = manifest;
  const [idx, setIdx] = useState(0);
  const [drag, setDrag] = useState(false);
  const [playing, setPlaying] = useState(autoplay);
  const vx = useRef(0);
  const raf = useRef<number | null>(null);
  const [scale] = useState(1);

  useEffect(() => {
    const loop = () => {
      if (drag) {
        if (Math.abs(vx.current) > 0.01) {
          setIdx(i => ((i + Math.round(vx.current)) % frames + frames) % frames);
          vx.current *= inertia!;
        }
      } else if (playing) {
        setIdx(i => (i + 0.25 + frames) % frames); // auto-spin suave cuando está en “play”
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [frames, inertia, drag, playing]);

  const onDown = (e: React.PointerEvent) => {
    setDrag(true);
    setPlaying(false); // si el usuario arrastra, pausamos
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
      setIdx(i => ((i - Math.trunc(delta)) % frames + frames) % frames);
      vx.current = delta;
    }
  };
  const onWheel = (_e: React.WheelEvent) => { /* zoom deshabilitado */ };

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
      {/* contador sutil */}
      <div className="pointer-events-none absolute bottom-1 right-2 text-[11px] text-slate-600 bg-white/70 px-2 py-0.5 rounded">
        {Math.floor(idx) + 1}/{frames}
      </div>
      {/* Play/Pause */}
      <button
        type="button"
        onClick={() => setPlaying(p => !p)}
        className="absolute top-2 left-2 text-[11px] px-2 py-1 rounded bg-white/80 border shadow hover:bg-white"
      >
        {playing ? "Pause" : "Play"}
      </button>
    </div>
  );
}
