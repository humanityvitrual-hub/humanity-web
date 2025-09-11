export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-neutral-400">
        <p>© {new Date().getFullYear()} Humanity — Your Own World</p>
      </div>
    </footer>
  );
}
