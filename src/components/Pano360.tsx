'use client';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export default function Pano360({ src, height='h-72' }: { src: string; height?: string }) {
  const texture = useLoader(THREE.TextureLoader, src);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return (
    <div className={height + " overflow-hidden rounded-xl border border-white/10 bg-black/40"}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 0.1], fov: 75 }}
        style={{ background: 'black' }}
      >
        {/* Esfera invertida: mostramos la textura por dentro */}
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial map={texture} side={THREE.BackSide} />
        </mesh>
        <OrbitControls enableZoom={false} enablePan={false} enableRotate rotateSpeed={0.7} />
      </Canvas>
    </div>
  );
}
