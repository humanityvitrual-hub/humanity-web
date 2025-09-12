'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';

type Tex = {
  albedo: THREE.Texture | null;
  normal: THREE.Texture | null;
  spec: THREE.Texture | null;
  lights: THREE.Texture | null;
  clouds: THREE.Texture | null;
};

function useEarthTextures(): Tex {
  const [tex, setTex] = useState<Tex>({
    albedo: null, normal: null, spec: null, lights: null, clouds: null
  });

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    const load = (url: string) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(url, t => resolve(t), undefined, err => reject(err));
      });

    (async () => {
      try {
        const [albedo, normal, spec, lights, clouds] = await Promise.all([
          load('/textures/earth/earth_atmos_2048.jpg'),
          load('/textures/earth/earth_normal_2048.jpg'),
          load('/textures/earth/earth_specular_2048.jpg'),
          load('/textures/earth/earth_lights_2048.png'),
          load('/textures/earth/earth_clouds_2048.png'),
        ]);

        [albedo, normal, spec, lights, clouds].forEach(t => {
          t.anisotropy = 8;
        });

        if (!cancelled) {
          setTex({ albedo, normal, spec, lights, clouds });
        }
      } catch {
        // Si alguna textura falla, al menos deja albedo para que no crashee
        try {
          const albedo = await load('/textures/earth/earth_atmos_2048.jpg');
          albedo.anisotropy = 8;
          if (!cancelled) setTex({ albedo, normal: null, spec: null, lights: null, clouds: null });
        } catch {
          if (!cancelled) setTex({ albedo: null, normal: null, spec: null, lights: null, clouds: null });
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return tex;
}

function Globe() {
  const group = useRef<THREE.Group>(null);
  const { albedo, normal, spec, lights, clouds } = useEarthTextures();

  useEffect(() => {
    const id = setInterval(() => {
      if (group.current) {
        group.current.rotation.y += 0.0008;
      }
    }, 16);
    return () => clearInterval(id);
  }, []);

  if (!albedo) return null;

  return (
    <group ref={group}>
      {/* globo */}
      <mesh>
        <sphereGeometry args={[1.6, 128, 128]} />
        <meshPhongMaterial
          map={albedo}
          normalMap={normal ?? undefined}
          specularMap={spec ?? undefined}
          shininess={8}
        />
      </mesh>

      {/* nubes */}
      {clouds && (
        <mesh>
          <sphereGeometry args={[1.62, 96, 96]} />
          <meshPhongMaterial
            map={clouds}
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* brillo de ciudades (lights como emissive) */}
      {lights && (
        <mesh>
          <sphereGeometry args={[1.605, 64, 64]} />
          <meshBasicMaterial map={lights} blending={THREE.AdditiveBlending} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

export default function Earth() {
  return (
    <Canvas camera={{ position: [0, 0, 4.2], fov: 50 }}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 4, 6]} intensity={1.2} />
      <directionalLight position={[-6, -3, -5]} intensity={0.3} />
      <Stars radius={100} depth={50} count={5000} factor={3} fade />
      <Globe />
      <OrbitControls enablePan={false} enableZoom={false} autoRotate={false} />
    </Canvas>
  );
}
