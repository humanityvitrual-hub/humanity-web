'use client';

import { useEffect, useRef } from 'react';

export default function AvatarSitepal({
  className = '',
  speaking = false,
  poster = '/avatars/host.jpg',
  bubble = 'Hola, bienvenido a Humanity.',
}: {
  className?: string;
  speaking?: boolean;
  poster?: string;
  bubble?: string;
}) {
  const mouthRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mouthRef.current) return;
    mouthRef.current.style.animationPlayState = speaking ? 'running' : 'paused';
    mouthRef.current.style.opacity = speaking ? '1' : '0';
  }, [speaking]);

  return (
    <figure
      className={[
        'relative w-full aspect-[3/4] rounded-2xl ring-1 ring-white/15',
        'bg-white/5 backdrop-blur shadow-lg overflow-hidden',
        className,
      ].join(' ')}
      aria-label="Anfitrión — Humanity"
    >
      {/* Cabeza redonda */}
      <div className="absolute inset-x-0 top-6 mx-auto h-[70%] w-[70%] rounded-full overflow-hidden">
        <img
          src={poster}
          alt="Anfitrión"
          className="w-full h-full object-cover select-none"
          draggable={false}
        />
        {/* Ojos (parpadeo) */}
        <div className="absolute left-1/3 top-[45%] h-2 w-2 rounded-full bg-white/90 animate-blink" />
        <div className="absolute right-1/3 top-[45%] h-2 w-2 rounded-full bg-white/90 animate-blink" />
        {/* Boca simple (se anima solo cuando speaking=true) */}
        <div
          ref={mouthRef}
          className="absolute left-1/2 top-[63%] -translate-x-1/2 w-10 h-2 rounded-full bg-white/90 opacity-0 animate-talk"
          style={{ animationPlayState: 'paused' }}
        />
      </div>

      {/* Globito */}
      <figcaption className="absolute bottom-3 left-3 right-3 rounded-xl px-3 py-2 text-sm bg-black/50 text-white backdrop-blur">
        {bubble}
      </figcaption>

      {/* Animaciones locales */}
      <style jsx>{`
        @keyframes blink {
          0%, 96%, 100% { transform: scaleY(1); }
          97% { transform: scaleY(0.05); }
          98% { transform: scaleY(0.05); }
          99% { transform: scaleY(1); }
        }
        .animate-blink { animation: blink 4.5s ease-in-out infinite; transform-origin: center; }

        @keyframes talk {
          0%   { transform: translateX(-50%) scaleY(0.2); }
          25%  { transform: translateX(-50%) scaleY(1.0); }
          50%  { transform: translateX(-50%) scaleY(0.4); }
          75%  { transform: translateX(-50%) scaleY(0.9); }
          100% { transform: translateX(-50%) scaleY(0.2); }
        }
        .animate-talk { animation: talk 220ms ease-in-out infinite; transform-origin: center top; }
      `}</style>
    </figure>
  );
}
