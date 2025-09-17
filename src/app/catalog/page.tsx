'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Product = { id: string; name: string; price: number; panoDataUrl: string; createdAt: number };

export default function Catalog() {
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    const products: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
    setItems(products.sort((a,b)=>b.createdAt-a.createdAt));
  }, []);
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl px-6 pt-28 pb-16">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Catálogo (demo)</h1>
          <Link href="/catalog/new" className="rounded-lg bg-white text-black px-4 py-2 font-semibold">
            Nuevo 360°
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <div className="text-white/60">Aún no hay productos. Crea el primero en “Nuevo 360°”.</div>
          ) : items.map(p => (
            <Link key={p.id} href={`/catalog/${p.id}`} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="text-white/70">${p.price.toFixed(2)}</div>
              <div className="text-sm underline mt-2">Ver detalle →</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
