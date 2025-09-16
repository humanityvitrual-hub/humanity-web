'use client';
import React, { useEffect, useRef, useState } from 'react';

type VoiceOpt = SpeechSynthesisVoice | null;

export default function TalkingHead() {
  const [mouth, setMouth] = useState(0);       // 0..1 apertura de boca
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [spanishVoice, setSpanishVoice] = useState<VoiceOpt>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis?.getVoices?.() || [];
      setVoices(v);
      const es = v.find(x => x.lang?.toLowerCase().startsWith('es'));
      setSpanishVoice(es || null);
    };
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const stopAnim = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setMouth(0);
    setSpeaking(false);
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Tu navegador no soporta síntesis de voz.');
      return;
    }
    window.speechSynthesis.cancel();
    stopAnim();

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = spanishVoice?.lang || 'es-ES';
    if (spanishVoice) utt.voice = spanishVoice;
    utt.rate = 1;
    utt.pitch = 1;
    utt.volume = 1;

    utt.onstart = () => {
      setSpeaking(true);
      let t = 0;
      timerRef.current = window.setInterval(() => {
        t += 0.18;
        const val = 0.15 + (Math.sin(t) * 0.5 + 0.5) * 0.85; // 0.15..1
        setMouth(val);
      }, 70);
    };
    utt.onend = () => {
      stopAnim();
    };
    utt.onerror = () => {
      stopAnim();
    };

    window.speechSynthesis.speak(utt);
  };

  const mouthRy = 4 + mouth * 14;
  const status = speaking ? 'Hablando…' : (spanishVoice ? 'Listo' : 'Cargando voz…');

  return (
    <div className="mt-8 flex flex-col items-center text-white">
      <svg width="260" height="260" viewBox="0 0 260 260" className="drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
        <circle cx="130" cy="130" r="120" fill="#0b0b10" stroke="#2c2c34" strokeWidth="2" />
        <circle cx="130" cy="105" r="60" fill="#1b1b23" stroke="#6ee7ff" strokeWidth="2" />
        <circle cx="110" cy="95" r="6" fill="#ffffff" />
        <circle cx="150" cy="95" r="6" fill="#ffffff" />
        <ellipse cx="130" cy="130" rx="22" ry={mouthRy} fill="#ff6b6b" />
        <rect x="118" y="160" width="24" height="22" rx="6" fill="#2a2a36" />
        <path d="M40 190 Q130 170 220 190 L220 215 Q130 195 40 215 Z" fill="#13131a" />
      </svg>

      <div className="mt-3 text-sm text-zinc-300">Estado: {status}</div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() =>
            speak('Hola, soy tu avatar. ¿En qué puedo ayudarte hoy? Puedo hablar español y reaccionar mientras hablo.')
          }
          className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition"
        >
          Hablar demo
        </button>
        <button
          onClick={() => {
            window.speechSynthesis?.cancel?.();
            stopAnim();
          }}
          className="px-4 py-2 rounded-lg border border-white/40 hover:bg-white/10 transition"
        >
          Parar
        </button>
      </div>
    </div>
  );
}
