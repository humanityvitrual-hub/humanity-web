"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, ContactShadows, OrbitControls, Stars, useTexture } from "@react-three/drei";

/**
 * /spin
 * - Subes un VIDEO -> extraemos 36 frames -> visor 360 clásico
 * - (Nuevo) Subes opcionalmente una FOTO 360 equirectangular para fondo
 * - Mostramos el producto en una escena 3D (billboard) con cámara orbit
 */

const N_FRAMES = 36;
const TARGET_SIZE = 640; // px

export default function SpinVideoVR() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [videoUrl, setVideoUrl] = useState<string>("");
  const [panoUrl, setPanoUrl] = useState<string>(""); // fondo 360 opcional
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);

  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (panoUrl) URL.revokeObjectURL(panoUrl);
      frames.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [videoUrl, panoUrl, frames]);

  // --------- inputs ----------
  const onPickVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFrames((prev) => { prev.forEach((u) => URL.revokeObjectURL(u)); return []; });
    setCurrent(0);
    const url = URL.createObjectURL(f);
    setVideoUrl(url);
    setLoaded(false);
  };

  const onPickPano = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (panoUrl) URL.revokeObjectURL(panoUrl);
    const url = URL.createObjectURL(f);
    setPanoUrl(url);
  };

  const onLoadedMeta = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
    setLoaded(true);
    v.pause();
    v.currentTime = 0;
  };

  // --------- extracción de frames ----------
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

    try { v.muted = true; await v.play(); v.pause(); } catch {}

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

    // limpiar previos
    frames.forEach((u) => URL.revokeObjectURL(u));
    const urls: string[] = [];

    const dt = duration / N_FRAMES;
    for (let i = 0; i < N_FRAMES; i++) {
      const t = i * dt;
      await seekTo(v, t);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(v, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);
      const blob: Blob = await new Promise((res) =>
        c.toBlob((b) => res(b as Blob), "image/webp", 0.92)
      );
      const url = URL.createObjectURL(blob);
      urls.push(url);
      setProgress(Math.round(((i + 1) / N_FRAMES) * 100));
      await new Promise((r) => setTimeout(r, 0));
    }

    setFrames(urls);
    setCurrent(0);
    setExtracting(false);
  }, [duration, frames]);

  // --------- drag para visor clásico (por si quieres rotar sin escena) ----------
  const onPointerDown = () => setDragging(true);
  const onPointerUp = () => setDragging(false);
  const onPointerMove = (ev: React.PointerEvent) => {
    if (!dragging || !frames.length) return;
    const SENS = 6;
    const delta = Math.trunc(ev.movementX / SENS);
    if (delta) {
      setCurrent((i) => {
        let n = (i - delta) % frames.length;
        if (n < 0) n += frames.length;
        return n;
      });
    }
  };

  const resetAll = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (panoUrl) URL.revokeObjectURL(panoUrl);
    frames.forEach((u) => URL.revokeObjectURL(u));
    setVideoUrl("");
    setPanoUrl("");
    setFrames([]);
    setLoaded(false);
    setDuration(0);
    setProgress(0);
    setCurrent(0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-6xl mx-auto pt-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Create a 360 product in a VR-like scene
        </h1>
        <p className="mt-2 text-slate-600">
          Upload a short spin video (8–12s) → we extract <b>36 frames</b>. Optional: upload a <b>360 photo</b> for background.  
          The product is shown in a <b>3D showroom</b> (Orbit camera + billboard).
          Preview-only (no backend).
        </p>

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center px-4 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition cursor-pointer">
            <input type="file" accept="video/*" onChange={onPickVideo} className="sr-only" />
            <span>Choose spin video</span>
          </label>

          <label className="inline-flex items-center px-4 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition cursor-pointer">
            <input type="file" accept="image/*" onChange={onPickPano} className="sr-only" />
            <span>Choose 360 background (optional)</span>
          </label>

          {videoUrl && (
            <>
              <button
                onClick={extractFrames}
                disabled={!loaded || extracting}
                className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition disabled:opacity-50 text-sm"
              >
                {extracting ? "Extracting…" : "Generate 360"}
              </button>
              <button
                onClick={resetAll}
                className="px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition text-sm"
              >
                Reset
              </button>
              {loaded ? <span className="text-emerald-600 text-sm">Video ready</span> : <span className="text-slate-500 text-sm">Loading…</span>}
            </>
          )}
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {/* Entrada: Video */}
          <div className="rounded-xl border bg-white/70 backdrop-blur p-3 shadow">
            {!videoUrl ? (
              <div className="aspect-video grid place-items-center text-slate-500">
                <p>Pick a <strong>video</strong> to start.</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full max-h-[70vh] rounded-lg"
                  playsInline
                  muted
                  controls
                  onLoadedMetadata={onLoadedMeta}
                />
                {extracting && (
                  <div className="mt-3">
                    <div className="h-2 bg-slate-200 rounded">
                      <div className="h-2 bg-slate-800 rounded transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs mt-2 text-slate-500">Extracting frames… {progress}%</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Escena 3D inmersiva */}
          <div className="rounded-xl border bg-white/70 backdrop-blur p-1 shadow">
            <div className="aspect-square rounded-lg overflow-hidden">
              <Canvas camera={{ position: [0, 1.2, 2.2], fov: 45 }}>
                <color attach="background" args={["#f7f9fb"]} />
                <SceneVR frames={frames} current={current} panoUrl={panoUrl} />
              </Canvas>
            </div>

            {/* fallback drag para cambiar frame también desde aquí */}
            {frames.length > 0 && (
              <div
                className="mt-2 text-center text-xs text-slate-500 select-none"
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onPointerMove={onPointerMove}
              >
                Drag horizontally to rotate • {current + 1}/{frames.length}
              </div>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}

/** Escena 3D: fondo 360 opcional + producto billboard + sombras + orbit */
function SceneVR({ frames, current, panoUrl }: { frames: string[]; current: number; panoUrl?: string }) {
  const { scene } = useThree();

  // Fondo 360 si hay pano
  useEffect(() => {
    if (!panoUrl) {
      scene.background = null;
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(
      panoUrl,
      (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        scene.background = tex;
      },
      undefined,
      () => {
        scene.background = null;
      }
    );
    return () => {
      const bg = scene.background as THREE.Texture | null;
      if (bg) bg.dispose?.();
      scene.background = null;
    };
  }, [panoUrl, scene]);

  // textura del frame actual
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!frames.length) { setTex(null); return; }
    const loader = new THREE.TextureLoader();
    const t = loader.load(frames[current], () => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      setTex(t);
    });
    return () => { t.dispose?.(); };
  }, [frames, current]);

  // luz suave
  useFrame(() => { /* hook para futuras animaciones si quieres */ });

  return (
    <>
      {/* Si no hay pano, ponemos estrellas para "feeling" inmersivo */}
      {!panoUrl && <Stars radius={50} depth={20} count={3000} factor={4} fade />}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} />

      {/* Producto: billboard frente a la cámara */}
      {tex && (
        <Billboard follow={false} position={[0, 1.0, 0]}>
          <mesh>
            {/* Escala del plano: ajusta [ancho, alto] si tu producto es más alto/ancho */}
            <planeGeometry args={[1.2, 1.2]} />
            <meshBasicMaterial map={tex} transparent />
          </mesh>
        </Billboard>
      )}

      {/* Piso/sombra para sensación de espacio */}
      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={10} blur={2.5} far={4} />

      <OrbitControls enableDamping dampingFactor={0.05} />
    </>
  );
}
