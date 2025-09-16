'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, useTexture } from '@react-three/drei';
import { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';

function TexturedEarth({ scale = 1.45 }: { scale?: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  // Texturas (día, normal, specular, nubes, luces nocturnas)
  const [colorMap, normalMap, specularMap, cloudsMap, lightsMap] = useTexture([
    '/textures/earth/earth_atmos_2048.jpg',
    '/textures/earth/earth_normal_2048.jpg',
    '/textures/earth/earth_specular_2048.jpg',
    '/textures/earth/earth_clouds_1024.png',
    '/textures/earth/earth_lights_2048.png',
  ]);

  // Ajustes de calidad
  [colorMap, normalMap, specularMap, cloudsMap, lightsMap].forEach(t => {
    // @ts-ignore - compatibilidad tres r15+
    if (t && 'colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
    if (t) t.anisotropy = 8;
  });

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 96, 96), []);

  // Rotación suave del planeta y ligera deriva de nubes
  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.08;
    if (cloudsRef.current) cloudsRef.current.rotation.y += dt * 0.02;
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Tierra (día) con normal+specular */}
      <mesh geometry={sphereGeo}>
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          shininess={18}
        />
      </mesh>

      {/* Nubes (un poco más grandes, semi-transp) */}
      <mesh ref={cloudsRef} geometry={sphereGeo} scale={1.01}>
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Luces nocturnas (sumadas) */}
      <mesh geometry={sphereGeo}>
        <meshBasicMaterial
          map={lightsMap}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Halo / atmósfera */}
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

export default function Earth() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 3.6], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.25 }}
      >
        {/* Iluminación más viva */}
        <ambientLight intensity={0.7} />
        <hemisphereLight skyColor={'#bcd3ff'} groundColor={'#090b10'} intensity={0.35} />
        <directionalLight position={[3, 5, 2]} intensity={1.25} />
        <directionalLight position={[-4, -2, -2]} intensity={0.35} />

        <Suspense fallback={null}>
          {/* Alineado a la derecha, con respiro al texto */}
          <group position={[1.0, 0.05, 0]}>
            <TexturedEarth />
          </group>
          <Stars radius={140} depth={70} count={1400} factor={3.0} fade speed={0.4} />
        </Suspense>

        {/* Importante: sin OrbitControls (cero interacción de mouse) */}
      </Canvas>
    </div>
  );
}
