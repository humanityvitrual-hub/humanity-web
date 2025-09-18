'use client';

import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { TextureLoader, BackSide } from 'three';

function Sphere({ src }: { src: string }) {
  const tex = useLoader(TextureLoader, src);
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[10, 64, 64]} />
      <meshBasicMaterial map={tex} side={BackSide} />
    </mesh>
  );
}

export default function Pano360({ src, height = 420 }: { src: string; height?: number }) {
  return (
    <div style={{ height }} className="rounded-xl overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault fov={75} position={[0, 0, 0.1]} />
        <OrbitControls enablePan={false} enableDamping dampingFactor={0.05} />
        <Sphere src={src} />
      </Canvas>
    </div>
  );
}
