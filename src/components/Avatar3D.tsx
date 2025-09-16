'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Box3, Vector3 } from 'three';

function FittedModel() {
  // Carga /avatar.glb (ya sin overrides)
  const { scene } = useGLTF('/avatar.glb');

  // Procesa: centra, escala y pone “de pie” al modelo
  const fitted = useMemo(() => {
    // Clonar para no mutar el original
    const root = scene.clone(true);

    // Sombras (opcional)
    root.traverse((o: any) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    // 1) Bounding inicial
    const box = new Box3().setFromObject(root);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());

    // 2) Centrar en X/Z (no tocar Y aún)
    root.position.sub(new Vector3(center.x, 0, center.z));

    // 3) Escalar a altura objetivo (p.ej. 1.8 m)
    const targetHeight = 1.8;
    const scale = size.y > 0 ? targetHeight / size.y : 1;
    root.scale.setScalar(scale);

    // 4) Recalcular y “bajar” hasta que minY sea 0 (parado en suelo)
    const boxAfter = new Box3().setFromObject(root);
    const minY = boxAfter.min.y;
    root.position.y -= minY; // ahora toca el suelo

    return root;
  }, [scene]);

  return <primitive object={fitted} />;
}

export default function Avatar3D() {
  return (
    <div className="mt-8 w-[520px] h-[520px] mx-auto">
      <Canvas camera={{ position: [0, 1.2, 3.2], fov: 45 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} castShadow />
        <FittedModel />
        <OrbitControls enablePan={false} enableDamping />
      </Canvas>
      <p className="text-center text-zinc-300 text-sm mt-2">
        Modelo: /avatar.glb — auto-fit (centrado/escala/suelo)
      </p>
    </div>
  );
}
