'use client';

import { useState } from 'react';
import Link from "next/link";
import { addProductFromFile, ensureDraft, seedDemo } from '@/lib/storage';
import { useRouter } from 'next/navigation';

export default function CreateShopPage() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const onDemo = () => {
    const d = seedDemo();
    router.push(`/s/${d.shopSlug}`);
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    await addProductFromFile(f);
    const d = ensureDraft();
    router.push(`/s/${d.shopSlug}`);
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold">Create your shop</h1>
      <p className="mt-2 text-slate-600">Upload a 360 photo to create your first virtual product.</p>

      <div className="mt-6 flex items-center gap-4">
        <button onClick={onDemo} className="rounded-lg bg-slate-900 text-white px-4 py-2">
          Use demo image
        </button>

        <label className="rounded-lg border px-4 py-2 cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={busy} />
          Upload 360
          <Link href="/spin" className="ml-3 px-3 py-2 rounded-lg border bg-white/70 shadow-sm hover:shadow transition text-sm">Upload spin video</Link>
        </label>
      </div>
    </main>
  );
}
