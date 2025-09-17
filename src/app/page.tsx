export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Hola 👋</h1>
      <p>Next.js 15 + Tailwind funcionando (prueba visual).</p>

      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid rgba(0,0,0,.1)',
        boxShadow: '0 2px 10px rgba(0,0,0,.06)',
        background: 'linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,.0))'
      }}>
        Si ves degradado, borde y sombra, el CSS global está aplicando bien.
      </div>
    </main>
  );
}
