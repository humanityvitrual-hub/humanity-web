'use client';

import { loadDraft } from '@/lib/storage';
import type { ShopDraft, VirtualProduct } from '@/types/shop';
import Pano360 from '@/components/Pano360';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ProductPage({ params }: { params: { id: string }}) {
  const [product, setProduct] = useState<VirtualProduct | null>(null);
  const [shopSlug, setShopSlug] = useState<string | null>(null);

  useEffect(() => {
    const d = loadDraft();
    if (!d) return;
    setShopSlug(d.shopSlug);
    const found = d.products.find(p => p.slug === params.id);
    if (found) setProduct(found);
  }, [params.id]);

  if (!product) {
    return (
      <main className="p-6">
        <p>Product not found in this browser.</p>
        <Link className="underline" href="/create-shop">Create one</Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        {shopSlug && <Link className="text-sm underline" href={`/s/${shopSlug}`}>Back to shop</Link>}
      </div>
      <div className="mt-4 border bg-white">
        <Pano360 src={product.media360.src} height={520} />
      </div>
    </main>
  );
}
