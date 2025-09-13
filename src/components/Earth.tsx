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

  [albedo, lights, clouds].forEach(t => { if (t) (t as any).colorSpace = THREE.SRGBColorSpace; });

  return (
    <group>
      <mesh rotation={[0.22, 0.62, 0]}>
        <sphereGeometry args={[1.95, 160, 160]} />
        <meshPhongMaterial
          map={albedo}
          normalMap={normal}
          specularMap={specular}
          shininess={20}
          emissiveMap={lights}
          emissiveIntensity={1.1}
          emissive={new THREE.Color('#ffffff')}
        />
      </mesh>

      {clouds && (
        <mesh rotation={[0.22, 0.62, 0]}>
          <sphereGeometry args={[2.0, 160, 160]} />
          <meshPhongMaterial map={clouds} transparent opacity={0.48} depthWrite={false}/>
        </mesh>
      )}

      <mesh>
        <sphereGeometry args={[2.06, 64, 64]} />
        <meshBasicMaterial color="#66c8ff" transparent opacity={0.07}/>
      </mesh>
    </group>
  );
}

export default function Earth() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      style={{ width:"100%", height:"100%" }}
    >
      <color attach="background" args={['#000']} />
      <ambientLight intensity={1.0} />
      <directionalLight position={[6, 4, 6]} intensity={1.9} color="#fff" />
      <directionalLight position={[-5, -3, -6]} intensity={0.6} color="#9fbaff" />
      <Globe />
      <Stars radius={150} depth={40} count={1600} factor={3} fade />
      <EffectComposer>
        <Bloom intensity={0.62} luminanceThreshold={0.22} luminanceSmoothing={0.12} />
      </EffectComposer>
      <OrbitControls autoRotate autoRotateSpeed={0.2} enablePan={false} enableZoom={false}/>
    </Canvas>
  );
}
