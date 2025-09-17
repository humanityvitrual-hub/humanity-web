type Props = { params: { slug: string } };
export default function ShopDetailPage({ params }: Props) {
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-3xl font-semibold">Shop: {params.slug}</h1>
      <div className="rounded-2xl border p-6">
        <p className="text-gray-600">
          Panorama 360° aquí (demo). Hotspots: Info • Producto • Enlace.
        </p>
      </div>
      <a className="underline" href="/explore">← Back to Explore</a>
    </main>
  );
}
