'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

function Globe() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.08;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 64, 64]} />
      {/* Material simple; luego cambiamos a texturas reales */}
      <meshStandardMaterial color="#3b82f6" roughness={0.7} metalness={0.0} />
    </mesh>
  );
}

export default function Earth() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3] }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <Suspense fallback={null}>
          <Globe />
          <Stars radius={100} depth={50} count={2000} factor={4} fade speed={1} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
