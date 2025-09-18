'use client';

import { loadDraft } from '@/lib/storage';
import type { ShopDraft } from '@/types/shop';
import Pano360 from '@/components/Pano360';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ShopView({ params }: { params: { slug: string }}) {
  const [draft, setDraft] = useState<ShopDraft | null>(null);

  useEffect(() => { setDraft(loadDraft()); }, []);
  if (!draft || draft.shopSlug !== params.slug) {
    return (
      <main className="p-6">
        <p>No shop found in this browser yet.</p>
        <Link className="underline" href="/create-shop">Create one</Link>
      </main>
    );
  }

  const first = draft.products[0];

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold">{draft.shopName}</h1>

      {first && (
        <div className="mt-6 border bg-white">
          <Pano360 src={first.media360.src} height={420} />
        </div>
      )}

      <h2 className="mt-8 text-xl font-semibold">Products</h2>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {draft.products.map(p => (
          <Link key={p.id} href={`/shop/${p.slug}`} className="rounded-lg border p-3 hover:shadow-sm transition">
            <div className="text-sm font-medium">{p.name}</div>
            <div className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleString()}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
