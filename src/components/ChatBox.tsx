'use client';

import { useEffect, useRef, useState } from 'react';

type Msg = { role: 'user' | 'bot'; text: string };

export default function ChatBox({
  onSpeakingChange,
  greeting = '¡Hola! Soy tu anfitrión. ¿Qué te gustaría explorar?',
  tts = true,
}: {
  onSpeakingChange?: (speaking: boolean) => void;
  greeting?: string;
  tts?: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'bot', text: greeting }]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const speak = (text: string) => {
    if (!tts) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-ES';
      u.onstart = () => onSpeakingChange?.(true);
      u.onend = () => onSpeakingChange?.(false);
      window.speechSynthesis.cancel(); // evita solapado
      window.speechSynthesis.speak(u);
    } catch {
      onSpeakingChange?.(false);
    }
  };

  const reply = (user: string): string => {
    const s = user.toLowerCase();
    if (/(hola|buenas|buenos días|buenas tardes|buenas noches)/.test(s))
      return '¡Hola! ¿Quieres crear tu “My World” o visitar una tienda 360°?';
    if (/(mundo|my world)/.test(s))
      return 'Tu “My World” es tu espacio inicial. Te ayudo a iniciarlo en un minuto.';
    if (/(tienda|shop|comprar|store)/.test(s))
      return 'Tenemos tiendas virtuales con fotos 360°. Te muestro un ejemplo y el mapa cercano.';
    if (/(pago|stripe|precio|precios)/.test(s))
      return 'MVP con Stripe en modo test y comisión de plataforma transparente.';
    if (/(seguridad|menor|adulto|moderación)/.test(s))
      return 'Separamos adultos/menores y moderamos contenido. Tu seguridad es prioridad.';
    return 'Puedo guiarte con “My World”, tiendas 360°, Stripe (test) y mapa de experiencias. ¿Qué quieres probar primero?';
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    onSpeakingChange?.(true);
    const bot = reply(text);
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'bot', text: bot }]);
      speak(bot);
      if (!tts) setTimeout(() => onSpeakingChange?.(false), Math.max(1500, (bot.split(/\s+/).length/140)*60000));
    }, 350);
  };

  return (
    <div className="w-full max-w-xl">
      <div
        ref={listRef}
        className="h-56 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
      >
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right mb-2' : 'text-left mb-2'}>
            <span
              className={[
                'inline-block rounded-2xl px-3 py-2 text-sm leading-relaxed max-w-[85%]',
                m.role === 'user'
                  ? 'bg-white text-black'
                  : 'bg-black/50 text-white border border-white/10',
              ].join(' ')}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe aquí…"
          className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none"
        />
        <button type="submit" className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium">
          Enviar
        </button>
      </form>

      <p className="mt-2 text-xs text-white/60">
        *MVP sin micrófono ni servicios externos. El avatar parpadea y mueve la boca cuando responde.
      </p>
    </div>
  );
}
