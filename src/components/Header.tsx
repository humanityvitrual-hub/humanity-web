'use client';

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-black/30 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="text-sm tracking-[0.35em] font-semibold">HUMANITY</div>
        <ul className="hidden md:flex items-center gap-8 text-sm text-zinc-300">
          <li><a className="hover:text-white transition" href="#">Home</a></li>
          <li><a className="hover:text-white transition" href="#">Shop</a></li>
          <li><a className="hover:text-white transition" href="#">About</a></li>
        </ul>
        <button className="rounded-full bg-white px-4 py-1.5 text-black text-sm font-semibold hover:opacity-90 transition">
          Sign in
        </button>
      </nav>
    </header>
  );
}
