'use client';
export default function StarsBG() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          'radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.9) 0, rgba(255,255,255,0) 60%),' +
          'radial-gradient(1.5px 1.5px at 70% 60%, rgba(255,255,255,0.6) 0, rgba(255,255,255,0) 60%),' +
          'radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.5) 0, rgba(255,255,255,0) 60%),' +
          'radial-gradient(1px 1px at 85% 25%, rgba(255,255,255,0.5) 0, rgba(255,255,255,0) 60%), #000',
      }}
    />
  );
}
