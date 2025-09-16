'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';

function TexturedEarth({ scale = 1.45 }: { scale?: number }) {
  const ref = useRef<THREE.Group>(null!);

  // Cargamos texturas
  const [colorMap, normalMap, specularMap, cloudsMap, lightsMap] = useTexture([
    '/textures/earth/earth_atmos_2048.jpg',   // mapa de color (día)
    '/textures/earth/earth_normal_2048.jpg',  // normal
    '/textures/earth/earth_specular_2048.jpg',// specular
    '/textures/earth/earth_clouds_1024.png',  // nubes (alpha)
    '/textures/earth/earth_lights_2048.png',  // luces nocturnas
  ]);

  // Ajustes recomendados
  [colorMap, normalMap, specularMap, cloudsMap, lightsMap].forEach(t => {
    if (!t) return;
    if ('colorSpace' in t) (t as any).colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });

  // Rotación suave del grupo
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.08;
  });

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 96, 96), []);

  return (
    <group ref={ref} scale={scale}>
      {/* Tierra (día) */}
      <mesh geometry={sphereGeo}>
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          shininess={12}
        />
      </mesh>

      {/* Nubes (ligeramente más grandes) */}
      <mesh geometry={sphereGeo} scale={1.01}>
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Luces nocturnas (additive) */}
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
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3.6], fov: 60 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 2]} intensity={1.15} />
        <directionalLight position={[-4, -2, -2]} intensity={0.35} />

        <Suspense fallback={null}>
          {/* Alineado a la derecha para dar respiro al texto */}
          <group position={[1.0, 0.05, 0]}>
            <TexturedEarth />
          </group>
          <Stars radius={120} depth={60} count={1200} factor={3.0} fade speed={0.5} />
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.35} />
      </Canvas>
    </div>
  );
}
