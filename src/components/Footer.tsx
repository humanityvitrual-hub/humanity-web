export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm opacity-70">
        © {new Date().getFullYear()} Humanity — Your Own World
      </div>
    </footer>
  );
}
