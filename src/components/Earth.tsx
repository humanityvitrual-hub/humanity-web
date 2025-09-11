'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { AdditiveBlending, DoubleSide } from 'three';
import { Suspense, useRef } from 'react';

function RealEarth() {
  const earthRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  const [albedo, normal, spec, clouds] = useTexture([
    '/textures/earth/earth_albedo.jpg',
    '/textures/earth/earth_normal.jpg',
    '/textures/earth/earth_spec.jpg',
    '/textures/earth/earth_clouds.png',
  ]);

  // Asegurar color correcto y mejor filtrado
  [albedo, clouds].forEach((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });
  [normal, spec].forEach((t) => (t.anisotropy = 8));

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.02;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.03;
  });

  return (
    <>
      {/* Tierra */}
      <mesh ref={earthRef} rotation={[0.3, 0.6, 0]}>
        <sphereGeometry args={[1.8, 96, 96]} />
        <meshPhongMaterial
          map={albedo}
          normalMap={normal}
          specularMap={spec}
          shininess={12}
        />
      </mesh>

      {/* Nubes */}
      <mesh ref={cloudsRef} rotation={[0.3, 0.6, 0]}>
        <sphereGeometry args={[1.83, 96, 96]} />
        <meshPhongMaterial
          map={clouds}
          transparent
          opacity={0.45}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      {/* Atmósfera */}
      <mesh>
        <sphereGeometry args={[1.92, 96, 96]} />
        <meshBasicMaterial
          color={'#4cc9f0'}
          transparent
          opacity={0.15}
          blending={AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  );
}

export default function Earth() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      style={{ position: 'fixed', inset: 0, zIndex: -1 }}
    >
      {/* Fondo de estrellas */}
      <Stars radius={120} depth={60} count={9000} factor={2.2} fade speed={0.6} />

      {/* Luces */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 2, 2]} intensity={1.2} />
      <pointLight position={[-4, -3, -2]} intensity={0.4} />

      {/* Carga de texturas protegida por Suspense */}
      <Suspense fallback={null}>
        <RealEarth />
      </Suspense>

      {/* Interacción controlada */}
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}
