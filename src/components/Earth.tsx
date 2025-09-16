'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, useTexture } from '@react-three/drei';
import { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';

function TexturedEarth({ scale = 1.5 }: { scale?: number }) {
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
    // @ts-ignore three r150+
    if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
  });

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 128, 128), []);

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.08;   // rotación del planeta
    if (cloudsRef.current) cloudsRef.current.rotation.y += dt * 0.03; // deriva de nubes
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* capa principal (día) con normales y especular más marcados */}
      <mesh geometry={sphereGeo}>
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(1.4, 1.4)}
          specularMap={specularMap}
          specular={new THREE.Color('#184a66')}
          shininess={30}
        />
      </mesh>

      {/* nubes más visibles */}
      <mesh ref={cloudsRef} geometry={sphereGeo} scale={1.012}>
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </mesh>

      {/* luces nocturnas (más brillantes) */}
      <mesh geometry={sphereGeo}>
        <meshBasicMaterial
          map={lightsMap}
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* halo/atmósfera para borde luminoso */}
      <mesh geometry={sphereGeo} scale={1.035}>
        <meshPhysicalMaterial
          color="#66c2ff"
          transparent
          opacity={0.18}
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
      ref.current.rotation.y += dt * 0.035;
      ref.current.rotation.x += dt * 0.006;
    }
  });
  return (
    <group ref={ref}>
      <Stars radius={180} depth={90} count={2200} factor={3.8} fade speed={0} />
    </group>
  );
}

export default function Earth() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 3.2], fov: 58 }}
        style={{ background: 'transparent' }}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 2.1,               // más brillante
          outputColorSpace: THREE.SRGBColorSpace,
          physicallyCorrectLights: true
        }}
      >
        {/* iluminación más rica: ambiente, hemisférica y "sol" cálido + rim frío */}
        <ambientLight intensity={0.9} />
        <hemisphereLight skyColor={'#cfe0ff'} groundColor={'#0a0c10'} intensity={0.6} />
        <directionalLight color={'#ffd7a1'} position={[5, 3, 2]} intensity={2.2} />
        <directionalLight color={'#6bb9ff'} position={[-5, 0, -3]} intensity={1.4} />
        <directionalLight position={[-2, 1, 1]} intensity={0.5} />

        <Suspense fallback={null}>
          {/* a la derecha para dejar espacio al texto */}
          <group position={[1.05, 0.05, 0]}>
            <TexturedEarth />
          </group>
          <MovingStars />
        </Suspense>

        {/* sin OrbitControls: no hay interacción del mouse */}
      </Canvas>
    </div>
  );
}
