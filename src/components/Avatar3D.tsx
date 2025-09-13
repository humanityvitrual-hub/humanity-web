"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Float, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

function AvatarModel({ onError }: { onError: (e: unknown) => void }) {
  try {
    const { scene } = useGLTF("/models/avatar.glb");
    const normalized = useMemo(() => {
      const s = scene.clone(true);
      const box = new THREE.Box3().setFromObject(s);
      const size = box.getSize(new THREE.Vector3()).length();
      const scale = size > 0 ? 1.6 / size : 1;
      s.scale.setScalar(scale);
      box.setFromObject(s);
      const center = box.getCenter(new THREE.Vector3());
      s.position.sub(center);
      s.position.y -= 0.2;
      return s;
    }, [scene]);
    return <primitive object={normalized} />;
  } catch (e) {
    onError(e);
    return null;
  }
}
useGLTF.preload("/models/avatar.glb");

function Fallback() {
  return (
    <Float speed={1} rotationIntensity={0.25} floatIntensity={0.6}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial metalness={0.2} roughness={0.4} />
      </mesh>
    </Float>
  );
}

export default function Avatar3D() {
  const [err, setErr] = useState<unknown | null>(null);

  return (
    <div className="relative w-[260px] h-[260px]">
      {err && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-red-600/20 text-red-300 text-xs font-semibold p-2">
          Error cargando /models/avatar.glb — revisa ruta y CORS
        </div>
      )}
      <Canvas camera={{ position: [0, 0.8, 2.3], fov: 40 }} shadows gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[1.5, 2, 2]} intensity={1.1} castShadow />
        <directionalLight position={[-2, 1, -1.5]} intensity={0.4} />
        <Environment preset="city" />
        <Suspense fallback={<Fallback />}>
          <AvatarModel onError={setErr} />
          <ContactShadows position={[0, -0.8, 0]} scale={3} opacity={0.25} blur={1.8} far={2.8} />
        </Suspense>
      </Canvas>
    </div>
  );
}
