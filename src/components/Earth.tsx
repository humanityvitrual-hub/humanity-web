'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, useTexture } from '@react-three/drei';
import { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';

function TexturedEarth({ scale = 1.15 }: { scale?: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  const [colorMap, normalMap, specularMap, cloudsMap, lightsMap] = useTexture([
    '/textures/earth/earth_atmos_2048.jpg',
    '/textures/earth/earth_normal_2048.jpg',
    '/textures/earth/earth_specular_2048.jpg',
    '/textures/earth/earth_clouds_1024.png',
    '/textures/earth/earth_lights_2048.png',
  ]);

  [colorMap, normalMap, specularMap, cloudsMap, lightsMap].forEach((t: any) => {
    if (!t) return;
    if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
  });

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 128, 128), []);

  // Rotación del planeta + deriva suave de nubes
  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.08;
    if (cloudsRef.current) cloudsRef.current.rotation.y += dt * 0.03;
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Superficie (día) con normal + specular */}
      <mesh geometry={sphereGeo}>
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(1.2, 1.2)}
          specularMap={specularMap}
          specular={new THREE.Color('#1a3d5a')}
          shininess={24}
        />
      </mesh>

      {/* Nubes */}
      <mesh ref={cloudsRef} geometry={sphereGeo} scale={1.008}>
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>

      {/* Luces nocturnas muy leves (casi de día) */}
      <mesh geometry={sphereGeo}>
        <meshBasicMaterial
          map={lightsMap}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Halo/atmósfera para el borde */}
      <mesh geometry={sphereGeo} scale={1.03}>
        <meshPhysicalMaterial
          color="#66c2ff"
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
      ref.current.rotation.y += dt * 0.03;
      ref.current.rotation.x += dt * 0.006;
    }
  });
  return (
    <group ref={ref}>
      <Stars radius={180} depth={90} count={2200} factor={3.6} fade speed={0} />
    </group>
  );
}

export default function Earth() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 4.2], fov: 58 }}   // más lejos => más pequeña
        style={{ background: 'transparent' }}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.85,                  // más vivo/brillante
          outputColorSpace: THREE.SRGBColorSpace,
          physicallyCorrectLights: true
        }}
      >
        {/* Iluminación tipo día: sol cálido + rim frío */}
        <ambientLight intensity={0.9} />
        <hemisphereLight skyColor={'#cfe0ff'} groundColor={'#0a0c10'} intensity={0.5} />
        <directionalLight color={'#ffe9bf'} position={[5, 3, 2]} intensity={1.7} />
        <directionalLight color={'#76c3ff'} position={[-4, 1, -2]} intensity={1.0} />
        <directionalLight position={[-2, -1, 1]} intensity={0.35} />

        <Suspense fallback={null}>
          {/* Más hacia el centro-derecha, dejando aire al texto */}
          <group position={[0.65, 0.02, 0]}>
            <TexturedEarth />
          </group>
          <MovingStars />
        </Suspense>

        {/* Sin OrbitControls: cero interacción */}
      </Canvas>
    </div>
  );
}
