"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

// Carga del globo SIN SSR
const Earth = dynamic(() => import("@/components/Earth"), { ssr: false });

export default function LandingPage() {
  return (
    <>
      {/* NAV */}
      <div className="nav">
        <Link href="/" className="brand">HUMANITY</Link>
        <div className="nav-right">
          <Link href="/">Home</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/auth/sign-in" className="btn">Sign in</Link>
        </div>
      </div>

      {/* Fondo 3D */}
      <div className="bg3d"><Earth /></div>
      <div className="vignette" />

      {/* HERO */}
      <main className="hero">
        <div className="hero-left">
          <h1 className="h1">Explore the World<br/>in 3D</h1>
          <p className="p">A virtual reality e-commerce platform.</p>
          <div className="cta">
            <Link href="/my-world" className="btn">Get Started</Link>
            <Link href="/about" className="btn ghost">Learn More</Link>
          </div>
          <p className="footer">© {new Date().getFullYear()} Humanity — Your Own World</p>
        </div>

        {/* Derecha: avatar (opcional). Coloca /public/images/assistant.jpg si quieres. */}
        <div className="avatar">
          <Image
            src="/images/assistant.jpg"
            alt="Assistant"
            fill
            sizes="360px"
            className="avatar-img"
            onErrorCapture={(e) => {
              // Si no existe la imagen, mostramos placeholder
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = 'none';
              const ph = document.getElementById('ph-avatar');
              if (ph) ph.style.display = 'block';
            }}
          />
          <div id="ph-avatar" className="avatar-ph" />
        </div>
      </main>

      {/* Estilos sin Tailwind: consistentes y “pixel perfect” */}
      <style jsx global>{`
        :root, html, body {
          margin: 0; padding: 0;
          background: #000; color: #fff;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
        }
        *, *::before, *::after { box-sizing: border-box; }
        a { color: #fff; text-decoration: none; }
        a:visited { color: #fff; }

        .nav {
          position: fixed; inset: 0 0 auto 0; z-index: 20;
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 24px; max-width: 1120px; margin: 0 auto; width: 100%;
        }
        .brand { font-weight: 700; letter-spacing: .14em; font-size: 14px; opacity: .95; }
        .nav-right { display: flex; align-items: center; gap: 16px; }
        .nav-right a { opacity: .85; }
        .nav-right a:hover { opacity: 1; }

        .btn {
          background: #fff; color: #000; font-weight: 600;
          padding: 10px 16px; border-radius: 12px;
        }
        .btn.ghost {
          background: transparent; color: #fff;
          border: 1px solid rgba(255,255,255,.2);
        }
        .btn:hover { filter: brightness(.95); }

        .bg3d { position: fixed; inset: 0; z-index: 0; }
        .vignette {
          position: fixed; inset: 0; z-index: 5; pointer-events: none;
          background: radial-gradient(ellipse at center,
            rgba(0,0,0,0) 0%,
            rgba(0,0,0,0.25) 55%,
            rgba(0,0,0,0.85) 100%);
        }

        .hero {
          position: relative; z-index: 10;
          min-height: 100svh; padding: 96px 24px 24px;
          max-width: 1120px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr; align-items: center; gap: 32px;
        }
        @media (min-width: 1024px) {
          .hero { grid-template-columns: 1fr 380px; }
        }

        .h1 { font-size: 56px; line-height: 1.05; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
        @media (min-width: 768px) { .h1 { font-size: 64px; } }
        .p { margin: 16px 0 0 0; opacity: .85; font-size: 18px; }
        .cta { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 12px; }
        .footer { margin-top: 40px; font-size: 12px; opacity: .6; }

        .avatar { display: none; position: relative; height: 520px; width: 360px; margin-left: auto; }
        .avatar-img { object-fit: cover; border-radius: 24px; border: 1px solid rgba(255,255,255,.1); }
        .avatar-ph {
          display: none; position: absolute; inset: 0; border-radius: 24px;
          border: 1px solid rgba(255,255,255,.1);
          background: radial-gradient(circle at 30% 30%, #444, #111);
        }
        @media (min-width: 1024px) { .avatar { display: block; } }
      `}</style>
    </>
  );
}
