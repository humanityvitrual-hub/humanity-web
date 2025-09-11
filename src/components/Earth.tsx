'use client';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader, AdditiveBlending, DoubleSide } from 'three';
import { useRef } from 'react';

function RealEarth() {
  const earthRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  // Texturas servidas por nuestra app (carpeta /public)
  const [albedo, normal, spec, clouds] = useLoader(TextureLoader, [
    '/textures/earth/earth_albedo.jpg',
    '/textures/earth/earth_normal.jpg',
    '/textures/earth/earth_spec.jpg',
    '/textures/earth/earth_clouds.png',
  ]);

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.02;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.03;
  });

  return (
    <>
      <mesh ref={earthRef} rotation={[0.3, 0.6, 0]}>
        <sphereGeometry args={[1.8, 96, 96]} />
        <meshPhongMaterial
          map={albedo}
          normalMap={normal}
          specularMap={spec}
          shininess={12}
        />
      </mesh>

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
      <Stars radius={120} depth={60} count={9000} factor={2.2} fade speed={0.6} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 2, 2]} intensity={1.2} />
      <pointLight position={[-4, -3, -2]} intensity={0.4} />
      <RealEarth />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}
