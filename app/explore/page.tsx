export default function ExplorePage() {
  const shops = [
    { name: "Café Patagonia", slug: "cafe-patagonia", city: "Buenos Aires" },
    { name: "VR Records", slug: "vr-records", city: "Barcelona" },
  ];
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Explore</h1>
      <p className="text-gray-500">Search & fly-to demo (client-side later).</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {shops.map(s => (
          <a key={s.slug} href={`/shop/${s.slug}`} className="rounded-2xl border p-5 hover:shadow-lg transition">
            <h2 className="text-xl font-medium">{s.name}</h2>
            <p className="text-gray-600">{s.city}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
