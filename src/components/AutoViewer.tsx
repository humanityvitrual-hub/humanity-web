'use client';
import { useEffect, useState } from 'react';
import Pano360 from './Pano360';

export default function AutoViewer({ src }: { src: string }) {
  const [kind, setKind] = useState<'loading'|'pano'|'flat'>('loading');

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      setKind(Math.abs(ratio - 2) < 0.02 ? 'pano' : 'flat');
    };
    img.onerror = () => setKind('flat');
    img.src = src;
  }, [src]);

  if (kind === 'loading') {
    return <div className="h-[420px] rounded-xl border bg-slate-100 animate-pulse" />;
  }

  if (kind === 'pano') {
    return (
      <div className="rounded-xl border overflow-hidden">
        <Pano360 src={src} />
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border overflow-hidden">
      <img src={src} alt="" className="w-full h-[420px] object-cover" />
      <span className="absolute left-2 top-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
        Not a 360 photo — showing flat view
      </span>
    </div>
  );
}
