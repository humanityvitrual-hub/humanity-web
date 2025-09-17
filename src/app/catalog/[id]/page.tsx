'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Pano360 from '@/components/Pano360';

type Product = { id: string; name: string; price: number; panoDataUrl: string; createdAt: number };

export default function ProductDetail() {
  const { id } = useParams<{id:string}>();
  const router = useRouter();
  const [p, setP] = useState<Product | null>(null);

  useEffect(() => {
    const products: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
    const found = products.find(x=>x.id === id);
    if (!found) return router.replace('/catalog');
    setP(found);
  }, [id, router]);

  const price = useMemo(() => p ? p.price.toFixed(2) : '', [p]);

  if (!p) return null;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-5xl px-6 pt-28 pb-16">
        <button onClick={()=>router.back()} className="text-sm underline decoration-white/30 underline-offset-4">← Volver</button>
        <h1 className="mt-4 text-3xl font-bold">{p.name}</h1>
        <div className="text-white/70">${price}</div>

        <div className="mt-6">
          <Pano360 src={p.panoDataUrl} height="h-[420px]" />
        </div>

        <div className="mt-6 flex gap-3">
          <button disabled className="rounded-lg bg-white/20 text-white/70 px-4 py-2">Comprar (en camino)</button>
          <button onClick={()=>router.push('/catalog')} className="rounded-lg border border-white/20 px-4 py-2">Ver catálogo</button>
        </div>
      </section>
    </main>
  );
}
