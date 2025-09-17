'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Pano360 from '@/components/Pano360';

type Product = { id: string; name: string; price: number; panoDataUrl: string; createdAt: number };

export default function NewProduct() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [panoDataUrl, setPanoDataUrl] = useState<string>('');

  // Guard simple (demo): requiere sesión local
  useEffect(() => {
    const s = localStorage.getItem('demo_session');
    if (!s) router.replace('/auth/sign-in?next=/catalog/new');
  }, [router]);

  const onFile = async (file: File) => {
    if (!file) return;
    const ok = file.type.startsWith('image/');
    if (!ok) return alert('Sube una imagen 360° (equirectangular JPG/PNG).');
    const reader = new FileReader();
    reader.onload = () => setPanoDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !panoDataUrl) return alert('Faltan datos');
    const products: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
    const id = Date.now().toString();
    products.push({ id, name, price: Number(price), panoDataUrl, createdAt: Date.now() });
    localStorage.setItem('products', JSON.stringify(products));
    router.replace('/catalog/' + id);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-4xl px-6 pt-28 pb-16">
        <h1 className="text-3xl font-bold">Nuevo producto (demo 360°)</h1>
        <p className="mt-2 text-white/70">Sube una foto 360° (desde tu celular funciona perfecto). Previsualiza en 3D.</p>

        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <input
              className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none"
              placeholder="Nombre del producto"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full rounded-lg bg-white/10 px-4 py-3 outline-none"
              type="number"
              min="0"
              step="0.01"
              placeholder="Precio"
              value={price as any}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <label className="block">
              <span className="text-sm text-white/70">Foto 360°</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="mt-2 w-full rounded-lg bg-white/10 px-4 py-2"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
              />
            </label>

            <button className="w-full rounded-lg bg-white text-black font-semibold py-3">Guardar</button>
          </div>

          <div>
            <div className="text-sm text-white/70 mb-2">Vista previa 360°</div>
            {panoDataUrl ? <Pano360 src={panoDataUrl} height="h-80" /> : (
              <div className="h-80 rounded-xl border border-white/10 bg-white/5 grid place-items-center text-white/50">
                Sube tu imagen 360° para previsualizar
              </div>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
