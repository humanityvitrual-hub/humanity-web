export type VirtualProduct = {
  id: string;
  slug: string;
  name: string;
  price?: number;
  media360: { src: string };
  initialView?: { yaw: number; pitch: number; fov: number };
  createdAt: string;
};

export type ShopDraft = {
  shopName: string;
  shopSlug: string;
  products: VirtualProduct[];
};
