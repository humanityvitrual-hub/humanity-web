'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef } from 'react';

function Globe() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.1;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 64, 64]} />
      {/* Material simple para que FUNCIONE ya mismo; luego cambiamos a texturas reales */}
      <meshStandardMaterial color="#3b82f6" roughness={0.7} metalness={0.0} />
    </mesh>
  );
}

export default function Earth() {
  return (
    <div className="pointer-events-none absolute right-[-8vw] top-[10vh] w-[60vw] h-[60vw] -z-10 hidden lg:block">
      <Canvas dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <Globe />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
      </Canvas>
    </div>
  );
}
