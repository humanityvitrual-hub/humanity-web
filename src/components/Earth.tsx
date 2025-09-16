'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

function Globe({ scale = 1.45 }: { scale?: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.08;
  });

  return (
    <>
      {/* Capa principal */}
      <mesh ref={ref} scale={scale}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshPhysicalMaterial
          color="#0f2a45"
          roughness={0.55}
          metalness={0.0}
          clearcoat={0.5}
          clearcoatRoughness={0.85}
        />
      </mesh>

      {/* Halo/atmósfera */}
      <mesh scale={scale * 1.03}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshPhysicalMaterial
          color="#5bb6ff"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Brillo especular suave arriba-derecha */}
      <mesh scale={scale * 1.01} position={[0.2, 0.18, 0.0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.06} />
      </mesh>
    </>
  );
}

export default function Earth() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3.6], fov: 60 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <directionalLight position={[-4, -2, -2]} intensity={0.4} />

        <Suspense fallback={null}>
          {/* Alineada a la derecha con respiro al texto */}
          <group position={[1.05, 0.05, 0]}>
            <Globe />
          </group>
          <Stars radius={120} depth={60} count={1200} factor={3.0} fade speed={0.5} />
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.35} />
      </Canvas>
    </div>
  );
}
