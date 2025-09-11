export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/40 border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <a href="/" className="text-lg font-semibold tracking-tight">Humanity</a>
        <nav className="flex items-center gap-2">
          <a href="/about" className="px-3 py-2 rounded hover:bg-white/10">About</a>
          <a href="/auth/sign-up" className="px-4 py-2 rounded bg-white text-black font-medium">Crear cuenta</a>
          <a href="/auth/sign-in" className="px-4 py-2 rounded border border-white/20 hover:bg-white/10">Entrar</a>
        </nav>
      </div>
    </header>
  );
}
