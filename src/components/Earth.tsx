'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

function Globe() {
  // esfera principal con gradiente (fallback si no hay texturas)
  return (
    <group>
      <mesh rotation={[0.1, 0.6, 0]}>
        <sphereGeometry args={[1.6, 128, 128]} />
        <meshPhysicalMaterial
          color="#0ea5e9"
          roughness={0.35}
          metalness={0.1}
          transmission={0}
          clearcoat={0.4}
          clearcoatRoughness={0.6}
          emissive={"#0ea5e9"}
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* glow anular sutil */}
      <mesh>
        <sphereGeometry args={[1.62, 64, 64]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

export default function Earth() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5.2], fov: 45, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
    >
      {/* luces */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 3, 2]} intensity={1.2} color={'#ffffff'} />
      <directionalLight position={[-3, -2, -1]} intensity={0.4} color={'#93c5fd'} />

      <Suspense fallback={null}>
        <Globe />
      </Suspense>

      {/* estrellas delicadas */}
      <Stars
        radius={120}
        depth={80}
        count={6000}
        factor={2}
        saturation={0}
        fade
        speed={0.2}
      />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.25}
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
