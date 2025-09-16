'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, useTexture } from '@react-three/drei';
import { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';

function TexturedEarth({ scale = 1.45 }: { scale?: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  const [colorMap, normalMap, specularMap, cloudsMap, lightsMap] = useTexture([
    '/textures/earth/earth_atmos_2048.jpg',
    '/textures/earth/earth_normal_2048.jpg',
    '/textures/earth/earth_specular_2048.jpg',
    '/textures/earth/earth_clouds_1024.png',
    '/textures/earth/earth_lights_2048.png',
  ]);

  [colorMap, normalMap, specularMap, cloudsMap, lightsMap].forEach(t => {
    if (!t) return;
    // @ts-ignore
    if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 96, 96), []);

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.08;  // rotación planeta
    if (cloudsRef.current) cloudsRef.current.rotation.y += dt * 0.025; // deriva nubes
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Día: más “vivo” con normal + specular */}
      <mesh geometry={sphereGeo}>
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          shininess={22}
        />
      </mesh>

      {/* Nubes */}
      <mesh ref={cloudsRef} geometry={sphereGeo} scale={1.01}>
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>

      {/* Luces nocturnas (más visibles) */}
      <mesh geometry={sphereGeo}>
        <meshBasicMaterial
          map={lightsMap}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Halo */}
      <mesh geometry={sphereGeo} scale={1.03}>
        <meshPhysicalMaterial
          color="#5bb6ff"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function MovingStars() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.03; // giro sutil
      ref.current.rotation.x += dt * 0.005;
    }
  });
  return (
    <group ref={ref}>
      <Stars radius={160} depth={80} count={1800} factor={3.6} fade speed={0} saturation={0} />
    </group>
  );
}

export default function Earth() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 3.4], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.85 }}
      >
        {/* Iluminación más brillante y balanceada */}
        <ambientLight intensity={0.95} />
        <hemisphereLight skyColor={'#bcd3ff'} groundColor={'#0b0d12'} intensity={0.55} />
        <directionalLight position={[3, 5, 2]} intensity={1.6} />
        <directionalLight position={[-2, 1, 1]} intensity={0.6} />
        <directionalLight position={[-5, -3, -2]} intensity={0.35} />

        <Suspense fallback={null}>
          {/* A la derecha, dejando espacio al texto */}
          <group position={[1.0, 0.05, 0]}>
            <TexturedEarth />
          </group>
          <MovingStars />
        </Suspense>

        {/* Sin OrbitControls: no hay interacción del mouse */}
      </Canvas>
    </div>
  );
}
