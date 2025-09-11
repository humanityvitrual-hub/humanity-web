'use client';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader, AdditiveBlending, DoubleSide } from 'three';
import { useRef } from 'react';

function RealEarth() {
  const earthRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  // Texturas públicas (hosted por three.js)
  const [albedo, normal, spec, clouds] = useLoader(TextureLoader, [
    'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_clouds_2048.png',
  ]);

  // Rotación sutil
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

      {/* Capa de nubes */}
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

      {/* Atmósfera (glow) */}
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
      {/* espacio */}
      <Stars radius={120} depth={60} count={9000} factor={2.2} fade speed={0.6} />

      {/* iluminación */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 2, 2]} intensity={1.2} />
      <pointLight position={[-4, -3, -2]} intensity={0.4} />

      <RealEarth />

      {/* control limitado: solo rotar, sin paneo ni zoom salvaje */}
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}
