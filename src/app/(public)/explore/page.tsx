export default function ExplorePage() {
  const shops = [
    { name: "Café Patagonia", city: "Buenos Aires", slug: "cafe-patagonia" },
    { name: "VR Records", city: "Barcelona", slug: "vr-records" },
  ];
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Explore</h1>
      <p className="text-gray-400">Tiendas destacadas para el demo.</p>
      <section className="grid sm:grid-cols-2 gap-4">
        {shops.map(s => (
          <a key={s.slug} href={`/shop/${s.slug}`} className="rounded-2xl border border-white/10 p-5 hover:shadow-lg transition">
            <h2 className="text-xl font-medium">{s.name}</h2>
            <p className="text-gray-500">{s.city}</p>
          </a>
        ))}
      </section>
    </main>
  );
}
