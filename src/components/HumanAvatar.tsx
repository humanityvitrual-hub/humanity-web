'use client';
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, Stage, OrbitControls, useGLTF } from '@react-three/drei';

function Model() {
  const { scene } = useGLTF('/avatar.glb');
  return <primitive object={scene} />;
}
useGLTF.preload('/avatar.glb');

export default function HumanAvatar() {
  return (
    <div className="w-full max-w-[900px] mx-auto">
      <div className="w-full aspect-[4/3] rounded-xl border border-white/15 overflow-hidden bg-black/40">
        <Canvas dpr={[1, 2]} shadows camera={{ position: [2, 1.6, 3], fov: 35 }}>
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.6} adjustCamera shadows>
              <Center>
                <Model />
              </Center>
            </Stage>
          </Suspense>
          <OrbitControls enablePan={false} />
        </Canvas>
      </div>
    </div>
  );
}
