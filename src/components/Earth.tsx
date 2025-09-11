'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function Globe() {
  const ref = useRef<THREE.Mesh>(null!);
  return (
    <mesh ref={ref} rotation={[0.3, 0.4, 0]}>
      <sphereGeometry args={[1.6, 64, 64]} />
      {/* material tipo “neón” */}
      <meshStandardMaterial
        color="#7dd3fc"
        roughness={0.25}
        metalness={0.6}
        emissive="#0ea5e9"
        emissiveIntensity={0.35}
      />
    </mesh>
  );
}

export default function Earth() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ position: 'fixed', inset: 0, zIndex: -1 }}
    >
      <Stars radius={80} depth={50} count={8000} factor={2} fade speed={0.6} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 2, 2]} intensity={1} />
      <Globe />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}
