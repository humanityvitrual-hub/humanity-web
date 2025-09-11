'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';

function GlobeSafe() {
  // Cargamos texturas con fallback para evitar excepciones si alguna falta
  let albedo: THREE.Texture | undefined;
  let normal: THREE.Texture | undefined;
  let spec: THREE.Texture | undefined;
  let clouds: THREE.Texture | undefined;

  try {
    [albedo, normal, spec, clouds] = useTexture([
      '/textures/earth/earth_albedo.jpg',
      '/textures/earth/earth_normal.jpg',
      '/textures/earth/earth_spec.jpg',
      '/textures/earth/earth_clouds.png',
    ]) as unknown as THREE.Texture[];
  } catch {
    // sin texturas: usamos materiales sólidos para no romper
  }

  return (
    <group>
      {/* Tierra */}
      <mesh rotation={[0.3, 0.4, 0]}>
        <sphereGeometry args={[1.6, 64, 64]} />
        {albedo ? (
          <meshStandardMaterial
            map={albedo}
            normalMap={normal}
            metalnessMap={spec}
            roughness={0.4}
            metalness={0.2}
          />
        ) : (
          <meshStandardMaterial color="#1f9cf0" roughness={0.3} metalness={0.5} />
        )}
      </mesh>

      {/* Nubes (solo si existe la textura) */}
      {clouds && (
        <mesh rotation={[0.3, 0.4, 0]}>
          <sphereGeometry args={[1.62, 64, 64]} />
          <meshStandardMaterial map={clouds} transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  );
}

export default function Earth() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <GlobeSafe />
          <Stars radius={50} depth={40} count={5000} factor={4} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} />
      </Canvas>
    </div>
  );
}
