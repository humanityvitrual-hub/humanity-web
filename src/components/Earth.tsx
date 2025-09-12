'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';

function Globe() {
  const [albedo, normal, specular, lights, clouds] = useTexture([
    '/textures/earth/earth_atmos_2048.jpg',
    '/textures/earth/earth_normal_2048.jpg',
    '/textures/earth/earth_specular_2048.jpg',
    '/textures/earth/earth_lights_2048.png',
    '/textures/earth/earth_clouds_1024.png',
  ]) as THREE.Texture[];

  // espacios de color y wrapping
  [albedo, lights, clouds].forEach((t) => t && (t.colorSpace = THREE.SRGBColorSpace));
  [albedo, normal, specular, lights, clouds].forEach((t) => {
    if (!t) return;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
  });

  return (
    <group rotation={[0.18, 0.5, 0]}>
      {/* planeta base */}
      <mesh>
        <sphereGeometry args={[1.75, 96, 96]} />
        <meshPhongMaterial
          map={albedo}
          normalMap={normal}
          specularMap={specular}
          shininess={12}
          emissiveMap={lights}
          emissiveIntensity={0.9}
          emissive={new THREE.Color('#3b82f6')} // da más “vida” al nocturno
        />
      </mesh>

      {/* capa de nubes */}
      {clouds && (
        <mesh>
          <sphereGeometry args={[1.78, 96, 96]} />
          <meshPhongMaterial
            map={clouds}
            transparent
            opacity={0.36}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* atmósfera (halo suave) */}
      <mesh>
        <sphereGeometry args={[1.84, 64, 64]} />
        <meshBasicMaterial
          color={'#60a5fa'}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function Earth() {
  return (
    <Canvas camera={{ position: [0, 0, 5.2], fov: 50 }}>
      <color attach="background" args={['#000']} />
      {/* iluminación más viva */}
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 5, 5]} intensity={1.4} />
      <directionalLight position={[-6, -3, -2]} intensity={0.5} />
      <Globe />
      <Stars radius={120} depth={60} count={4500} factor={4} fade />
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.35}
        enablePan={false}
        enableZoom={false}
      />
    </Canvas>
  );
}
