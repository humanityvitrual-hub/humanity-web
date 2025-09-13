'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function Globe() {
  const [albedo, normal, specular, lights, clouds] = useTexture([
    '/textures/earth/earth_atmos_2048.jpg',
    '/textures/earth/earth_normal_2048.jpg',
    '/textures/earth/earth_specular_2048.jpg',
    '/textures/earth/earth_lights_2048.png',
    '/textures/earth/earth_clouds_1024.png'
  ]) as THREE.Texture[];

  [albedo, lights, clouds].forEach(t => { if (t) t.colorSpace = THREE.SRGBColorSpace; });

  return (
    <group>
      <mesh rotation={[0.25, 0.6, 0]}>
        <sphereGeometry args={[1.7, 96, 96]} />
        <meshPhongMaterial
          map={albedo}
          normalMap={normal}
          specularMap={specular}
          shininess={12}
          emissiveMap={lights}
          emissiveIntensity={0.9}
          emissive={new THREE.Color('#ffffff')}
        />
      </mesh>

      {clouds && (
        <mesh rotation={[0.25, 0.6, 0]}>
          <sphereGeometry args={[1.73, 96, 96]} />
          <meshPhongMaterial map={clouds} transparent opacity={0.5} depthWrite={false}/>
        </mesh>
      )}

      <mesh>
        <sphereGeometry args={[1.78, 64, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.08}/>
      </mesh>
    </group>
  );
}

export default function Earth() {
  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
    >
      <color attach="background" args={['#000']} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 4, 5]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-4, -3, -5]} intensity={0.4} color="#88aaff" />
      <Globe />
      <Stars radius={120} depth={40} count={2000} factor={3} fade />
      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.2} luminanceSmoothing={0.1} />
      </EffectComposer>
      <OrbitControls autoRotate autoRotateSpeed={0.25} enablePan={false} enableZoom={false}/>
    </Canvas>
  );
}
