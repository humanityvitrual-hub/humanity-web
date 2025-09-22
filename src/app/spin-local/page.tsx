// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import SpinViewer from '@/components/SpinViewer';

export default function SpinLocal() {
  const [src, setSrc] = useState(null);
  const [name, setName] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  function onPick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) { setMsg('Choose a video file'); return; }
    if (src) URL.revokeObjectURL(src);
    const url = URL.createObjectURL(f);
    setSrc(url);
    setName(f.name);
    setMsg('Loaded ✅  Drag on the video to rotate');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-4xl mx-auto pt-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Video spin (local)</h1>
        <p className="mt-2 text-slate-600">Pick a short product spin video (8–12s). No backend; works in Vercel Preview.</p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start">
          <input type="file" accept="video/*" onChange={onPick} className="block rounded-lg border px-4 py-2 bg-white" />
          <span className="text-sm text-slate-600">{msg}</span>
        </div>

        <section className="mt-8">
          {src ? (
            <div>
              <div className="mb-2 text-sm text-slate-600">{name}</div>
              <SpinViewer src={src} className="max-w-3xl" />
            </div>
          ) : (
            <div className="rounded-xl border bg-white p-6 text-slate-600">
              No video yet. Pick one above to preview.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
