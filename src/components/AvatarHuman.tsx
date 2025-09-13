'use client';

import { useEffect, useRef } from 'react';

type Props = {
  className?: string;
  videoSrc?: string;  // URL del MP4/WEBM del avatar humano
  poster?: string;    // imagen de portada si el video tarda
  greeting?: string;
};

export default function AvatarHuman({
  className = '',
  // 🎥 Video humano de prueba (presentadora hablando)
  // Cámbialo por tu /avatars/host.webm o /avatars/host.mp4 cuando lo tengas.
  videoSrc = 'https://cdn.coverr.co/videos/coverr-woman-talking-on-a-video-call-4059/1080p.mp4',
  poster = 'https://images.unsplash.com/photo-1536305030439-0e840f256c88?w=800&auto=format&fit=crop',
  greeting = 'Hola, te doy la bienvenida a Humanity.',
}: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.play().catch(() => {});
      else el.pause();
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure
      className={[
        'relative overflow-hidden rounded-2xl ring-1 ring-white/15',
        'shadow-lg bg-white/5 backdrop-blur',
        'aspect-[3/4] mx-auto',   // tamaño controlado por el padre
        className,
      ].join(' ')}
      aria-label="Anfitrión humano de Humanity"
      title="Anfitrión — Humanity"
    >
      <video
        ref={ref}
        src={videoSrc}
        poster={poster}
        playsInline
        autoPlay
        muted
        loop
        className="block w-full h-full object-cover"
      />
      <div className="absolute bottom-3 left-3 right-3 rounded-xl px-3 py-2 text-sm bg-black/50 text-white backdrop-blur">
        {greeting}
      </div>
    </figure>
  );
}
