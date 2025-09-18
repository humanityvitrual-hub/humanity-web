'use client';
import type { ShopDraft, VirtualProduct } from '@/types/shop';

const KEY = 'shopDraft';

export function loadDraft(): ShopDraft | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as ShopDraft; } catch { return null; }
}

export function saveDraft(d: ShopDraft) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(d));
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

export function ensureDraft(): ShopDraft {
  const existing = loadDraft();
  if (existing) return existing;
  const empty: ShopDraft = { shopName: 'My Shop', shopSlug: 'my-shop', products: [] };
  saveDraft(empty);
  return empty;
}

export async function addProductFromFile(file: File): Promise<VirtualProduct> {
  const dataURL = await fileToDataURL(file);
  return addProductFromDataURL(file.name, dataURL);
}

export function addProductFromDataURL(name: string, dataURL: string): VirtualProduct {
  const d = ensureDraft();
  const id = cryptoRandom();
  const p: VirtualProduct = {
    id,
    slug: slugify(name || 'product-'+id),
    name: name || 'Untitled product',
    media360: { src: dataURL },
    createdAt: new Date().toISOString(),
  };
  d.products.unshift(p);
  saveDraft(d);
  return p;
}

export function seedDemo(): ShopDraft {
  const d: ShopDraft = {
    shopName: 'Demo Shop',
    shopSlug: 'demo-shop',
    products: [{
      id: cryptoRandom(),
      slug: 'earth-360',
      name: 'Earth 360',
      media360: { src: '/images/earth-hero.jpg' },
      createdAt: new Date().toISOString()
    }],
  };
  saveDraft(d);
  return d;
}

function fileToDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function cryptoRandom() {
  // @ts-ignore
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
