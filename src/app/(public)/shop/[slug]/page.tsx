type Props = { params: { slug: string } };
export default function ShopDetailPage({ params }: Props) {
  const { slug } = params;
  const pretty = slug.replace(/-/g, " ");
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-3xl font-semibold capitalize">Shop: {pretty}</h1>
      <div className="rounded-2xl border border-white/10 p-6">
        <p className="text-gray-400">
          Aquí irá el visor 360° con hotspots (demo). Por ahora es un placeholder navegable.
        </p>
      </div>
      <a className="underline" href="/explore">← Back to Explore</a>
    </main>
  );
}
