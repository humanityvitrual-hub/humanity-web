'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useRef } from 'react';

function Globe() {
  const group = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [albedo, normal, specular, lights, clouds] = useTexture([
    '/textures/earth/earth_atmos_2048.jpg',
    '/textures/earth/earth_normal_2048.jpg',
    '/textures/earth/earth_specular_2048.jpg',
    '/textures/earth/earth_lights_2048.png',
    '/textures/earth/earth_clouds_1024.png',
  ]) as THREE.Texture[];

  // SRGB y wrapping
  [albedo, lights, clouds].forEach((t) => t && (t.colorSpace = THREE.SRGBColorSpace));
  [albedo, normal, specular, lights, clouds].forEach((t) => {
    if (!t) return;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
    t.anisotropy = 8;
  });

  // Animación suave: nubes y sutil cabeceo
  useFrame((state, delta) => {
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.02; // nubes más lentas
    if (group.current) {
      const t = state.clock.getElapsedTime();
      group.current.rotation.z = Math.sin(t * 0.15) * 0.03; // sutil “tilt”
    }
  });

  return (
    <group ref={group} rotation={[0.18, 0.5, 0]}>
      {/* Planeta base con más contraste/specular */}
      <mesh>
        <sphereGeometry args={[1.75, 128, 128]} />
        <meshPhongMaterial
          map={albedo}
          normalMap={normal}
          normalScale={new THREE.Vector2(0.7, 0.7)}
          specularMap={specular}
          shininess={28}
          emissiveMap={lights}
          emissive={new THREE.Color('#8ab4ff')}
          emissiveIntensity={1.15}   // ciudadelas más vivas
        />
      </mesh>

      {/* Capa de nubes con blend y movimiento */}
      {clouds && (
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[1.79, 128, 128]} />
          <meshPhongMaterial
            map={clouds}
            transparent
            opacity={0.35}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </mesh>
      )}

      {/* Atmósfera: backface + halo aditivo (doble capa) */}
      <mesh>
        <sphereGeometry args={[1.84, 96, 96]} />
        <meshBasicMaterial
          color={'#5ab0ff'}
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.88, 96, 96]} />
        <meshBasicMaterial
          color={'#7cc4ff'}
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function Earth() {
  return (
    <Canvas camera={{ position: [0, 0, 5.1], fov: 50 }}>
      <color attach="background" args={['#000']} />

      {/* Iluminación: sol cálido + rim frío + ambiente */}
      <hemisphereLight skyColor={'#8ecafe'} groundColor={'#0b1c2e'} intensity={0.35} />
      <directionalLight position={[6, 5, 4]} intensity={1.45} color={'#fff2d6'} />
      <directionalLight position={[-5, -3, -2]} intensity={0.6} color={'#a8c7ff'} />
      <ambientLight intensity={0.7} />

      <Globe />

      {/* Estrellas en dos capas para parallax */}
      <Stars radius={140} depth={80} count={4200} factor={4} fade />
      <Stars radius={220} depth={120} count={2200} factor={8} saturation={0} fade />

      {/* Bloom para realzar luces nocturnas y brillos especulares */}
      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.2} luminanceSmoothing={0.6} mipmapBlur />
      </EffectComposer>

      <OrbitControls autoRotate autoRotateSpeed={0.36} enablePan={false} enableZoom={false} />
    </Canvas>
  );
}
