'use client';

import Script from 'next/script';

export default function Demo3D() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 p-6">
      {/* Cargamos el web component desde CDN SOLO en cliente */}
      <Script
        type="module"
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        strategy="afterInteractive"
      />

      <div className="max-w-4xl mx-auto pt-10 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">3D Demo (preview)</h1>
        <p className="text-slate-600">
          Esto es lo que queremos lograr: un producto 3D con órbita, zoom y auto-rotación.
        </p>

        <div className="rounded-xl border bg-white/70 backdrop-blur p-3 shadow">
          <model-viewer
            src="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
            camera-controls
            auto-rotate
            shadow-intensity="0.7"
            exposure="1.0"
            style={{ width: '100%', height: '70vh', background: '#111' }}
            ar
          ></model-viewer>
        </div>
      </div>
    </main>
  );
}
