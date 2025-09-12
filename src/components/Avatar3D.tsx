'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, Html, useGLTF } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

type Avatar3DProps = {
  modelUrl?: string;   // p.ej. "/avatars/assistant.glb"
  className?: string;
  autoRotate?: boolean;
};

function PlaceholderAvatar() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) group.current.position.y = 0.02 * Math.sin(t * 1.5);
  });
  return (
    <group ref={group} position={[0, -0.9, 0]} scale={1.1}>
      {/* cabeza */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.6, 48, 48]} />
        <meshStandardMaterial roughness={0.4} metalness={0.1} color="#c9a27e" />
      </mesh>
      {/* torso (simple) */}
      <mesh position={[0, -0.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 1.2, 0.5]} />
        <meshStandardMaterial roughness={0.8} metalness={0.05} color="#2b2b2b" />
      </mesh>
    </group>
  );
}

function AvatarGLTF({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF(url) as any;
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) group.current.position.y = 0.02 * Math.sin(t * 1.5);
  });
  return (
    <group ref={group} position={[0, -0.9, 0]} rotation={[0, Math.PI * 0.05, 0]} scale={1.1}>
      <primitive object={gltf.scene} />
    </group>
  );
}

export default function Avatar3D({ modelUrl, className, autoRotate = false }: Avatar3DProps) {
  return (
    <div
      className={`relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl ${className ?? ''}`}
      style={{ aspectRatio: '3 / 4' }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />
      <Canvas dpr={[1, 2]} shadows gl={{ antialias: true, physicallyCorrectLights: true }} camera={{ position: [0, 1.1, 2.2], fov: 35 }}>
        <hemisphereLight intensity={0.45} color="#ffffff" groundColor="#0b1020" />
        <directionalLight position={[2.5, 3, 2]} intensity={2.0} castShadow shadow-mapSize={1024} />
        <Environment preset="city" />
        <Suspense fallback={<Html center className="text-sm text-white/80">Loading…</Html>}>
          {modelUrl ? <AvatarGLTF url={modelUrl} /> : <PlaceholderAvatar />}
        </Suspense>
        <ContactShadows position={[0, -1.15, 0]} opacity={0.35} scale={5} blur={2.6} far={2.5} />
      </Canvas>
    </div>
  );
}
