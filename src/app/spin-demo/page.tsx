// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import SpinViewer from '@/components/SpinViewer';

export default function SpinDemo() {
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>('');

  // cargar último video si existe
  useEffect(() => {
    fetch('/api/upload')
      .then(r => r.json())
      .then(d => { if (d?.ok && d.files?.length) setSrc(d.files[0].url); })
      .catch(() => {});
  }, []);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const f = form.get('file') as File | null;
    if (!f) { setMsg('Choose a video'); return; }
    if (!f.type.startsWith('video/')) { setMsg('Only video files'); return; }

    setBusy(true); setMsg('Uploading...');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.ok) {
        setSrc(data.url);
        setMsg('Uploaded ✅');
      } else {
        setMsg(data.error || 'Upload error');
      }
    } catch (err: any) {
      setMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      <div className="max-w-4xl mx-auto pt-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Spin demo (upload & rotate)</h1>
        <p className="mt-2 text-slate-600">Upload a short product spin video (8–12s). Then drag to rotate.</p>

        <form onSubmit={onUpload} className="mt-6 flex flex-col sm:flex-row gap-3 items-start">
          <input
            type="file"
            name="file"
            accept="video/*"
            className="block rounded-lg border px-4 py-2 bg-white"
            disabled={busy}
          />
          <button
            disabled={busy}
            className="rounded-lg bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
          >
            {busy ? 'Uploading…' : 'Upload'}
          </button>
          <span className="text-sm text-slate-600">{msg}</span>
        </form>

        <section className="mt-8">
          {src ? (
            <SpinViewer src={src} className="max-w-3xl" />
          ) : (
            <div className="rounded-xl border bg-white p-6 text-slate-600">
              No video yet. Upload one above to start.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
