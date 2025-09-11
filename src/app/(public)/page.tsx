import dynamic from "next/dynamic";

const Earth = dynamic(() => import("@/components/Earth"), { ssr: false });

export default function LandingPage() {
  return (
    <>
      {/* fondo 3D */}
      <Earth />
      {/* glow suave */}
      <div aria-hidden className="hero-bg" />
      <div aria-hidden className="hero-grid" />

      {/* navbar */}
      <header className="navbar">
        <div className="container inner">
          <a className="logo" href="/">Humanity</a>
          <nav>
            <a className="link" href="/about">About</a>
            <a className="btn btn-ghost" href="/auth/sign-in">Entrar</a>
            <a className="btn btn-primary" href="/auth/sign-up">Crear cuenta</a>
          </nav>
        </div>
      </header>

      {/* hero sobre el 3D */}
      <main className="section center" style={{paddingTop:'7rem'}}>
        <div className="container" style={{backdropFilter:'blur(2px)'}}>
          <h1 style={{fontSize:'clamp(2.75rem,5vw,4rem)',margin:0,fontWeight:800,letterSpacing:'.3px'}}>
            Your Own World
          </h1>
          <p style={{maxWidth:720,margin:'1rem auto 0',color:'var(--muted)'}}>
            Crea y explora tu propio mundo digital. Construimos la base para
            experiencias personalizadas y escalables.
          </p>

          <div style={{display:'flex',gap:'1rem',justifyContent:'center',marginTop:'1.5rem',flexWrap:'wrap'}}>
            <a className="btn btn-primary" href="/my-world">Enter My World</a>
            <a className="btn btn-ghost" href="/about">Learn More</a>
          </div>

          <div className="grid" style={{marginTop:'2rem'}}>
            <div className="card">Tiendas 3D personalizadas</div>
            <div className="card">Entornos 360° y VR</div>
            <div className="card">Pagos (Stripe en modo test)</div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container" style={{padding:'1.25rem 0', fontSize:14}}>
          © {new Date().getFullYear()} Humanity — Your Own World
        </div>
      </footer>
    </>
  );
}
