'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

function Globe({ scale = 1.8 }: { scale?: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.08;
  });

  return (
    <>
      {/* Capa principal del planeta */}
      <mesh ref={ref} scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        {/* Material simple pero más “profundo” */}
        <meshPhysicalMaterial
          color="#0f2a45" roughness={0.6} metalness={0.0}
          clearcoat={0.6} clearcoatRoughness={0.8}
        />
      </mesh>

      {/* Atmósfera sutil (halo) */}
      <mesh scale={scale * 1.03}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          color="#5bb6ff" transparent opacity={0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  );
}

export default function Earth() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3.2], fov: 50 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <directionalLight position={[-4, -2, -2]} intensity={0.4} />

        <Suspense fallback={null}>
          {/* Desplazamos la esfera a la derecha para que el texto respire */}
          <group position={[1.4, 0.1, 0]}>
            <Globe scale={2.0} />
          </group>
          <Stars radius={120} depth={60} count={1500} factor={3.5} fade speed={0.6} />
        </Suspense>

        {/* Rotación automática suave, sin zoom/drag */}
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
