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
    '/textures/earth/earth_clouds_1024.png'
  ]) as THREE.Texture[];

  [albedo, lights, clouds].forEach(t => { if (t) t.colorSpace = THREE.SRGBColorSpace; });
  [albedo, normal, specular, lights, clouds].forEach(t => {
    if (!t) return;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
  });

  return (
    <group>
      <mesh rotation={[0.25, 0.6, 0]}>
        <sphereGeometry args={[1.7, 96, 96]} />
        <meshPhongMaterial
          map={albedo}
          normalMap={normal}
          specularMap={specular}
          shininess={8}
          emissiveMap={lights}
          emissiveIntensity={0.6}
          emissive={new THREE.Color('white')}
        />
      </mesh>

      {clouds && (
        <mesh rotation={[0.25, 0.6, 0]}>
          <sphereGeometry args={[1.73, 96, 96]} />
          <meshPhongMaterial map={clouds} transparent opacity={0.35} depthWrite={false}/>
        </mesh>
      )}

      <mesh>
        <sphereGeometry args={[1.78, 64, 64]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.06}/>
      </mesh>
    </group>
  );
}

export default function Earth() {
  return (
    <div className="h-full w-full">
      <Canvas className="h-full w-full" style={{ width: '100%', height: '100%' }} camera={{ position: [0, 0, 5], fov: 50 }}>
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Globe />
        <Stars radius={100} depth={40} count={3000} factor={4} fade />
        <OrbitControls autoRotate autoRotateSpeed={0.25} enablePan={false} enableZoom={false}/>
      </Canvas>
    </div>
  );
}
