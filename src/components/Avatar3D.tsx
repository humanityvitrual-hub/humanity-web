'use client';
import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Html, useGLTF, useAnimations, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

type AvatarProps = {
  url?: string;           // por defecto /models/avatar.glb
  autoRotate?: boolean;   // auto-rotación suave
  animation?: string;     // nombre de la animación si el modelo trae
  scale?: number;
};

function AvatarModel({ url = '/models/avatar.glb', animation, scale = 1 }: AvatarProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);

  useMemo(() => {
    scene.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (obj.material && obj.material.metalness !== undefined) {
          obj.material.metalness = Math.min(0.2, obj.material.metalness ?? 0.2);
          obj.material.roughness = Math.max(0.4, obj.material.roughness ?? 0.4);
        }
      }
    });
  }, [scene]);

  // Tocar animación si existe
  if (animation && actions && actions[animation]) {
    actions[animation]?.reset().fadeIn(0.5).play();
  } else if (animations && animations.length > 0) {
    // si no pasan nombre, toma la primera
    actions[animations[0].name]?.reset().fadeIn(0.5).play();
  }

  return <primitive ref={group} object={scene} scale={scale} position={[0, -1.2, 0]} />;
}

function AvatarStage({ url, autoRotate = true, animation }: AvatarProps) {
  const root = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && root.current) {
      root.current.rotation.y += delta * 0.3; // giro muy sutil
    }
  });

  return (
    <group ref={root}>
      {/* Avatar */}
      <AvatarModel url={url} animation={animation} scale={1.2} />
      {/* Sombras de contacto para “pegarlo” al plano */}
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.35}
        scale={6}
        blur={2.5}
        far={3.5}
      />
      {/* Ambiente de estudio limpio */}
      <Environment preset="studio" />
    </group>
  );
}

export default function Avatar3D() {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 3.2], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      shadows="soft"
    >
      <color attach="background" args={['transparent']} />
      <hemisphereLight intensity={0.7} groundColor={'#0b1c2e'} />
      <directionalLight position={[4, 6, 3]} intensity={1.3} castShadow shadow-mapSize={[1024,1024]} />
      <Suspense fallback={<Html center style={{color:'#fff', fontSize:14, opacity:.8}}>Loading avatar…</Html>}>
        <AvatarStage />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI/3.5} maxPolarAngle={Math.PI/1.7}/>
    </Canvas>
  );
}

// Precarga opcional
useGLTF.preload('/models/avatar.glb');
