export default function ShopIndexPage() {
  const shops = [
    { name: "Café Patagonia", slug: "cafe-patagonia" },
    { name: "VR Records", slug: "vr-records" },
  ];
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-3xl font-semibold">Shops</h1>
      <ul className="list-disc pl-6">
        {shops.map(s => (
          <li key={s.slug}><a className="underline" href={`/shop/${s.slug}`}>{s.name}</a></li>
        ))}
      </ul>
    </main>
  );
}
