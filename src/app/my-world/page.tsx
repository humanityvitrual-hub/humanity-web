const cards = [
  { title: "Explorar", href: "/explore", desc: "Visita mundos y tiendas en 3D/VR." },
  { title: "Catálogo", href: "/shop", desc: "Tiendas demo y próximamente catálogo." },
  { title: "Próximamente", href: "/about", desc: "Roadmap y visión." },
];
export default function MyWorldPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-semibold mb-6">My World</h1>
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <a key={c.title} href={c.href} className="rounded-2xl border p-5 hover:shadow-lg transition">
            <h2 className="text-xl font-medium">{c.title}</h2>
            <p className="text-gray-600">{c.desc}</p>
          </a>
        ))}
      </section>
    </main>
  );
}
