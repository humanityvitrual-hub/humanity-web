'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Suspense, useMemo } from 'react';

function EarthMesh() {
  const [
    mapColor,
    mapNormal,
    mapSpec,
    mapLights,
    mapClouds,
  ] = useTexture([
    '/textures/earth/earth_atmos_2048.jpg',
    '/textures/earth/earth_normal_2048.jpg',
    '/textures/earth/earth_specular_2048.jpg',
    '/textures/earth/earth_lights_2048.png',
    '/textures/earth/earth_clouds_2048.png',
  ]);

  // Ajustes de filtros (mejor nitidez)
  useMemo(() => {
    [mapColor, mapNormal, mapSpec, mapLights, mapClouds].forEach((t) => {
      t.anisotropy = 8;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    });
  }, [mapColor, mapNormal, mapSpec, mapLights, mapClouds]);

  // Grupo para rotación lenta
  const ROT = 0.02;

  return (
    <group rotation={[0.15, 0.6, 0]}>
      {/* Globo principal */}
      <mesh>
        <sphereGeometry args={[1.6, 128, 128]} />
        {/* Mezcla: color + luces nocturnas usando MeshPhongMaterial */}
        <meshPhongMaterial
          map={mapColor}
          normalMap={mapNormal}
          specularMap={mapSpec}
          specular={new THREE.Color('#4a90e2')}
          shininess={12}
          emissiveMap={mapLights}
          emissiveIntensity={0.75}
          emissive={new THREE.Color('#0b0f24')}
        />
      </mesh>

      {/* Capa de nubes (ligeramente más grande) */}
      <mesh>
        <sphereGeometry args={[1.62, 128, 128]} />
        <meshPhongMaterial
          map={mapClouds}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>

      {/* Halo atmosférico usando un material aditivo suave */}
      <mesh>
        <sphereGeometry args={[1.68, 64, 64]} />
        <meshBasicMaterial
          color="#3fa8ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default function Earth() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.6], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#000']} />
      {/* Estrellas finas al fondo */}
      <Stars radius={100} depth={50} count={4000} factor={2} fade />

      {/* Luces suaves */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 3, 5]} intensity={1.1} />
      <directionalLight position={[-5, -3, -5]} intensity={0.35} />

      <Suspense fallback={null}>
        <EarthMesh />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.75}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </Canvas>
  );
}
