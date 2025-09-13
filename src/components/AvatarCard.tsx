'use client';
export default function AvatarCard({
  className = '',
  src = '/avatars/host.jpg',
  caption = 'Hola, bienvenido a Humanity.',
}: { className?: string; src?: string; caption?: string }) {
  return (
    <figure
      className={[
        'relative rounded-2xl overflow-hidden',
        'ring-1 ring-white/15 shadow-lg bg-white/5 backdrop-blur',
        'w-full aspect-[3/4]',
        className,
      ].join(' ')}
    >
      <img src={src} alt="Anfitrión" className="w-full h-full object-cover" />
      <figcaption className="absolute bottom-3 left-3 right-3 text-sm bg-black/50 backdrop-blur rounded-xl px-3 py-2">
        {caption}
      </figcaption>
    </figure>
  );
}
