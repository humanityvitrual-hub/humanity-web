'use client';
import { Canvas, useLoader } from '@react-three/fiber';
import { TextureLoader, BackSide } from 'three';
import { OrbitControls } from '@react-three/drei';

function Sphere({ src }: { src: string }) {
  const tex = useLoader(TextureLoader, src);
  return (
    <mesh>
      <sphereGeometry args={[500, 64, 64]} />
      <meshBasicMaterial map={tex} side={BackSide} />
    </mesh>
  );
}

export default function Pano360({ src }: { src: string }) {
  return (
    <Canvas camera={{ position: [0, 0, 0.1], fov: 65 }} style={{ width: '100%', height: 420 }}>
      <ambientLight intensity={1} />
      <Sphere src={src} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} />
    </Canvas>
  );
}
