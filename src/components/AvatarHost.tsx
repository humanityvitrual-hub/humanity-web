'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Avatar en Canvas:
 * - Dibuja tu foto (public/avatars/host.jpg)
 * - Parpadea cada 3–6s
 * - Anima la boca según visemas muy simples del texto (A,E,I,O,U, resto)
 * - Puede usar speechSynthesis del navegador (opcional)
 */

const W = 360;
const H = 360;

function textToVisemes(text: string) {
  // Muy simple: mapea caracteres a "boca" (aperturas)
  // valores 0..1 (0 cerrado, 1 muy abierto)
  const seq: number[] = [];
  const t = text.toLowerCase();
  for (const ch of t) {
    if ('aeáàâãåä'.includes(ch)) seq.push(0.95);
    else if ('oóòôõö'.includes(ch)) seq.push(0.8);
    else if ('uúùûü'.includes(ch)) seq.push(0.7);
    else if ('iíìîïy'.includes(ch)) seq.push(0.55);
    else if ('eéèêë'.includes(ch)) seq.push(0.65);
    else if (',.;:!?'.includes(ch)) seq.push(0.2);
    else if (ch === ' ') seq.push(0.1);
    else seq.push(0.35);
  }
  // comprime un poco la secuencia para no ser tan larga
  const compressed: number[] = [];
  for (let i = 0; i < seq.length; i += 2) {
    const a = seq[i];
    const b = seq[i + 1] ?? a;
    compressed.push((a + b) / 2);
  }
  return compressed;
}

export default function AvatarHost({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [isBlink, setIsBlink] = useState(false);
  const mouthPos = useRef(0);           // 0..1 apertura actual
  const targetMouth = useRef(0);        // 0..1 objetivo
  const visemeSeq = useRef<number[]>([]);
  const visemeIndex = useRef(0);
  const speaking = useRef(false);

  // Carga de la imagen
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/avatars/host.jpg';
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    img.onerror = () => {
      // placeholder si no hay imagen
      const fallback = document.createElement('canvas');
      fallback.width = 10; fallback.height = 10;
      const ctx = fallback.getContext('2d')!;
      ctx.fillStyle = '#222'; ctx.fillRect(0,0,10,10);
      const img2 = new Image();
      img2.src = fallback.toDataURL();
      imgRef.current = img2;
      setReady(true);
    };
  }, []);

  // Parpadeo aleatorio
  useEffect(() => {
    const id = setInterval(() => {
      setIsBlink(true);
      setTimeout(() => setIsBlink(false), 160);
    }, 3000 + Math.random() * 3000);
    return () => clearInterval(id);
  }, []);

  // Bucle de dibujo
  useEffect(() => {
    if (!ready) return;
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext('2d')!;
    cvs.width = W;
    cvs.height = H;

    let raf = 0;
    const draw = () => {
      // fondo circular
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.beginPath();
      ctx.arc(W/2, H/2, W/2 - 4, 0, Math.PI * 2);
      ctx.clip();

      // imagen base
      const img = imgRef.current!;
      // encuadre: centrado (puedes ajustar offsets si quieres)
      ctx.drawImage(img, 0, 0, W, H);

      // Ojos/parpadeo: renderizamos dos “párpados” rápidos
      if (isBlink) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        // banda superior que baja
        ctx.fillRect(0, 0, W, H * 0.45);
        // banda inferior que sube
        ctx.fillRect(0, H * 0.6, W, H * 0.4);
      }

      // Interpolación suave de la boca hacia su objetivo
      mouthPos.current += (targetMouth.current - mouthPos.current) * 0.25;

      // Boca: elipse simple paramétrica
      const cx = W * 0.52;  // centro boca (ajusta si tu foto tiene otra posición)
      const cy = H * 0.70;
      const breadth = 38;    // ancho
      const openness = 4 + mouthPos.current * 26; // alto según apertura

      ctx.fillStyle = '#151515';
      ctx.beginPath();
      ctx.ellipse(cx, cy, breadth, openness, 0, 0, Math.PI * 2);
      ctx.fill();

      // “labio” brillo leve
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 1, breadth, Math.max(2, openness - 2), 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      // Borde
      ctx.beginPath();
      ctx.arc(W/2, H/2, W/2 - 2, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'white';
      ctx.stroke();

      // Avance de visemas si estamos “hablando”
      if (speaking.current && visemeSeq.current.length) {
        if (performance.now() % 120 < 60) {
          // cada ~120ms actualizamos el target
          targetMouth.current = visemeSeq.current[visemeIndex.current] ?? 0.1;
          visemeIndex.current++;
          if (visemeIndex.current >= visemeSeq.current.length) {
            // fin
            speaking.current = false;
            targetMouth.current = 0.1;
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ready, isBlink]);

  // API pública simple: speak(text)
  const speak = (text: string) => {
    visemeSeq.current = textToVisemes(text);
    visemeIndex.current = 0;
    speaking.current = true;
    targetMouth.current = 0.2;

    // Opcional: decirlo con TTS del navegador
    try {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'es-ES';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    } catch {}
  };

  // Demo: que diga algo al cargar
  useEffect(() => {
    const id = setTimeout(() => {
      speak('Hola, soy tu anfitriona virtual. ¿En qué puedo ayudarte hoy?');
    }, 800);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className={['flex flex-col items-center', className].join(' ')}>
      <canvas ref={canvasRef} className="w-72 h-72 md:w-80 md:h-80" />
      <button
        onClick={() =>
          speak('Puedo guiarte para crear tu mundo o visitar tiendas virtuales.')
        }
        className="mt-4 px-4 py-2 rounded-md bg-white text-black font-semibold"
      >
        Hablar demo
      </button>
    </div>
  );
}
