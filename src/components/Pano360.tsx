'use client';

import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { TextureLoader, BackSide, SRGBColorSpace } from 'three';
import { useEffect, useMemo } from 'react';

function usePreparedTexture(src: string) {
  const tex = useLoader(TextureLoader, src);
  const { gl } = useThree();
  useEffect(() => {
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = gl.capabilities.getMaxAnisotropy?.() ?? 8;
    tex.needsUpdate = true;
  }, [tex, gl]);
  return tex;
}

function SphereEquirect({ src }: { src: string }) {
  const tex = usePreparedTexture(src);
  return (
    <mesh scale={[-1, 1, 1]} rotation-y={Math.PI}>
      <sphereGeometry args={[10, 64, 64]} />
      <meshBasicMaterial map={tex} side={BackSide} />
    </mesh>
  );
}

function CurvedPanel({ src }: { src: string }) {
  const tex = usePreparedTexture(src);
  // panel cilíndrico ~162°
  const radius = 6;
  const height = 4;
  const thetaLength = Math.PI * 0.9; // 162°
  return (
    <mesh rotation-y={Math.PI}>
      <cylinderGeometry
        args={[radius, radius, height, 96, 1, true, -thetaLength / 2, thetaLength]}
      />
      <meshBasicMaterial map={tex} side={BackSide} />
    </mesh>
  );
}

export default function Pano360({ src, height = 420 }: { src: string; height?: number }) {
  // Cargamos SOLO para leer dimensiones y decidir si es 2:1
  const tex = useLoader(TextureLoader, src);
  const isEquirect =
    tex.image &&
    tex.image.width &&
    tex.image.height &&
    Math.abs(tex.image.width / tex.image.height - 2) < 0.05;

  const cameraPos = useMemo<[number, number, number]>(
    () => (isEquirect ? [0, 0, 0.1] : [0, 0, 8]),
    [isEquirect]
  );

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden">
      <Canvas dpr={[1, 2]} gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault fov={isEquirect ? 75 : 50} position={cameraPos} />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          autoRotate
          autoRotateSpeed={0.15}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI - 0.1}
        />
        {isEquirect ? <SphereEquirect src={src} /> : <CurvedPanel src={src} />}
      </Canvas>
    </div>
  );
}
