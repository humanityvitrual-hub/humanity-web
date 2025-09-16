'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function Head({ speaking }: { speaking: boolean }) {
  const mouthRef = useRef<THREE.Mesh>(null!);
  const headRef = useRef<THREE.Group>(null!);
  const pupilL = useRef<THREE.Mesh>(null!);
  const pupilR = useRef<THREE.Mesh>(null!);

  // Boca “abre/cierra” cuando habla
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const k = speaking ? (0.18 + 0.12 * Math.abs(Math.sin(t * 10))) : 0.06;
    if (mouthRef.current) mouthRef.current.scale.y = k / 0.08;

    // Ojitos siguen sutilmente el puntero
    const x = THREE.MathUtils.clamp(state.pointer.x, -0.35, 0.35);
    const y = THREE.MathUtils.clamp(-state.pointer.y, -0.25, 0.25);
    if (pupilL.current) pupilL.current.position.set(-0.23 + x * 0.07, 0.07 + y * 0.05, 0.51);
    if (pupilR.current) pupilR.current.position.set( 0.23 + x * 0.07, 0.07 + y * 0.05, 0.51);

    // cabeceo sutil
    if (headRef.current) headRef.current.rotation.set(0.08*Math.sin(t*0.6), 0.12*Math.sin(t*0.8), 0);
  });

  const skin = new THREE.MeshStandardMaterial({ color: '#ffd7b1', roughness: 0.45, metalness: 0.0 });
  const black = new THREE.MeshStandardMaterial({ color: 'black' });
  const white = new THREE.MeshStandardMaterial({ color: 'white' });
  const lip   = new THREE.MeshStandardMaterial({ color: '#ee6b6e', roughness: 0.9 });

  return (
    <group ref={headRef} position={[0, -0.15, 0]} scale={1.1}>
      {/* cabeza */}
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[0.75, 3]} />
        <meshStandardMaterial color={'#f6c7a3'} roughness={0.5} />
      </mesh>

      {/* ojos blancos */}
      <mesh position={[-0.23, 0.07, 0.5]}><sphereGeometry args={[0.12, 24, 24]} /><primitive object={white} attach="material" /></mesh>
      <mesh position={[ 0.23, 0.07, 0.5]}><sphereGeometry args={[0.12, 24, 24]} /><primitive object={white} attach="material" /></mesh>

      {/* pupilas */}
      <mesh ref={pupilL}><sphereGeometry args={[0.05, 24, 24]} /><primitive object={black} attach="material" /></mesh>
      <mesh ref={pupilR}><sphereGeometry args={[0.05, 24, 24]} /><primitive object={black} attach="material" /></mesh>

      {/* boca (rectángulo redondeado muy plano que escalamos en Y) */}
      <mesh ref={mouthRef} position={[0, -0.15, 0.55]} scale={[1, 0.75, 1]}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 24]} />
        <primitive object={lip} attach="material" />
      </mesh>

      {/* pechito para que no se vea “flotando” */}
      <mesh position={[0, -1.0, 0]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.6, 0.3, 24]} />
        <meshStandardMaterial color={'#222'} roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function TalkingHead3D() {
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus]   = useState('Listo');
  const [voice, setVoice]     = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis?.getVoices?.() || [];
      const es = v.find((x) => x.lang?.toLowerCase().startsWith('es'));
      setVoice(es || null);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const hablar = () => {
    if (!('speechSynthesis' in window)) {
      setStatus('TTS no disponible'); return;
    }
    const u = new SpeechSynthesisUtterance(
      'Hola, soy un avatar 3D. Este es un ejemplo gratuito. Podemos reemplazarme por un modelo humano real cuando quieras.'
    );
    if (voice) u.voice = voice;
    u.rate = 1.05; u.pitch = 1.0;
    u.onstart = () => { setSpeaking(true);  setStatus('Hablando…'); };
    u.onend   = () => { setSpeaking(false); setStatus('Listo'); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };
  const parar = () => { window.speechSynthesis.cancel(); setSpeaking(false); setStatus('Listo'); };

  return (
    <div className="w-full max-w-[720px] mx-auto">
      <div className="mx-auto w-full aspect-[4/3] rounded-xl border border-white/15 overflow-hidden bg-black/40">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0.45, 2.2], fov: 35, near: 0.1, far: 100 }}
        >
          {/* luces bonitas pero económicas */}
          <ambientLight intensity={0.35} />
          <directionalLight position={[2, 2.5, 2]} intensity={1.0} castShadow />
          <directionalLight position={[-2, 1.5, -1]} intensity={0.25} />
          <group position={[0, 0.15, 0]}>
            <Head speaking={speaking} />
          </group>
          <OrbitControls enablePan={false} minDistance={1.8} maxDistance={3} target={[0, 0.05, 0]} />
        </Canvas>
      </div>

      <div className="mt-3 text-center text-sm text-zinc-300">
        Estado: <span className="font-semibold">{status}</span>
      </div>
      <div className="mt-2 flex justify-center gap-2">
        <button onClick={hablar} className="px-3 py-1 rounded bg-white text-black text-sm">Hablar demo</button>
        <button onClick={parar}  className="px-3 py-1 rounded border border-white/50 text-sm">Parar</button>
      </div>
    </div>
  );
}
