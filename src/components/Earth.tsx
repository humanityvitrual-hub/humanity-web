'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useRef } from 'react';

function Globe() {
  const earthRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  const [
    colorMap,         // base color
    normalMap,        // normals
    specularMap,      // specular
    cloudsMap,        // clouds (png, transparent)
    lightsMap         // city lights (emissive)
  ] = useTexture([
    '/textures/earth/earth_atmos_2048.jpg',
    '/textures/earth/earth_normal_2048.jpg',
    '/textures/earth/earth_specular_2048.jpg',
    '/textures/earth/earth_clouds_2048.png',
    '/textures/earth/earth_lights_2048.png',
  ]) as unknown as [
    THREE.Texture, THREE.Texture, THREE.Texture, THREE.Texture, THREE.Texture
  ];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (earthRef.current) earthRef.current.rotation.y = t * 0.04;
    if (cloudsRef.current) cloudsRef.current.rotation.y = t * 0.045;
  });

  return (
    <>
      {/* Glow / Atmosphere */}
      <mesh>
        <sphereGeometry args={[1.03, 64, 64]} />
        <meshBasicMaterial color="#3abefb" side={THREE.BackSide} transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Earth */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 128, 128]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          shininess={8}
          specular={new THREE.Color(0x222222)}
          emissiveMap={lightsMap}
          emissiveIntensity={0.65}
          emissive={new THREE.Color(0x111111)}
        />
      </mesh>

      {/* Clouds */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.008, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

export default function Earth() {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.6], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Iluminación */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-5, -3, -5]} intensity={0.4} />

      {/* Fondo de estrellas */}
      <Stars radius={100} depth={50} count={4000} factor={4} fade />

      <Globe />
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}
