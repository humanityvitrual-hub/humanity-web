"use client";
import dynamic from "next/dynamic";
import Link from "next/link";

const Earth = dynamic(() => import("@/components/Earth"), { ssr: false });

export default function Landing() {
  return (
    <>
      {/* Header fijo */}
      <div
        style={{
          position: "fixed",
          inset: "0 0 auto 0",
          zIndex: 30,
          width: "100%",
          height: 64,
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            href="/"
            style={{
              fontWeight: 700,
              letterSpacing: ".14em",
              fontSize: 14,
              color: "#fff",
              textDecoration: "none",
            }}
          >
            HUMANITY
          </Link>
          <nav style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <Link href="/" style={{ color: "#fff", textDecoration: "none", opacity: 0.9 }}>
              Home
            </Link>
            <Link href="/shop" style={{ color: "#fff", textDecoration: "none", opacity: 0.9 }}>
              Shop
            </Link>
            <Link href="/about" style={{ color: "#fff", textDecoration: "none", opacity: 0.9 }}>
              About
            </Link>
            <Link
              href="/auth/sign-in"
              style={{
                background: "#fff",
                color: "#000",
                fontWeight: 600,
                padding: "10px 16px",
                borderRadius: 12,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </nav>
        </div>
      </div>

      {/* Fondo 3D con ligero offset */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          transform: "translate(10vw, 6vh) scale(.9)",
          transformOrigin: "center",
          pointerEvents: "none",
        }}
      >
        <Earth />
      </div>
      {/* Vignette/overlay para legibilidad */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 5,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 35% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,.25) 55%, rgba(0,0,0,.85) 100%)",
        }}
      />

      {/* HERO */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 1120,
          margin: "0 auto",
          padding: "220px 24px 48px", /* <-- SIEMPRE padding alto */
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 32,
          alignItems: "center",
        }}
      >
        {/* Columna izquierda */}
        <section style={{ maxWidth: 640 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 64,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: "-.02em",
              textShadow: "0 6px 24px rgba(0,0,0,.45)",
            }}
          >
            Explore the World
            <br />
            in 3D
          </h1>

          <p
            style={{
              marginTop: 18,
              opacity: 0.92,
              fontSize: 18,
              textShadow: "0 4px 16px rgba(0,0,0,.35)",
            }}
          >
            A virtual reality e-commerce platform.
          </p>

          <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12 }}>
            {/* primario: blanco con texto negro visible */}
            <Link
              href="/my-world"
              style={{
                display: "inline-block",
                background: "#ffffff",
                color: "#111111",
                fontWeight: 800,
                padding: "14px 22px",
                borderRadius: 14,
                textDecoration: "none",
                boxShadow: "0 8px 28px rgba(255,255,255,.16)",
                letterSpacing: ".02em",
              }}
            >
              Get Started
            </Link>
            {/* secundario: borde + texto blanco */}
            <Link
              href="/about"
              style={{
                display: "inline-block",
                border: "1px solid rgba(255,255,255,.28)",
                color: "#ffffff",
                padding: "14px 22px",
                borderRadius: 14,
                textDecoration: "none",
                background: "rgba(255,255,255,0.03)",
                fontWeight: 700,
                letterSpacing: ".02em",
              }}
            >
              Learn More
            </Link>
          </div>

          <p style={{ marginTop: 40, fontSize: 12, opacity: 0.65 }}>
            © {new Date().getFullYear()} Humanity — Your Own World
          </p>
        </section>

        {/* Columna derecha: AVATAR SIEMPRE visible */}
        <aside style={{ display: "block" }}>
          <div
            style={{
              position: "relative",
              height: 540,
              width: 420,
              marginLeft: "auto",
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,0.1)",
              background:
                "radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,.06) 0%, rgba(0,0,0,.35) 55%, rgba(0,0,0,.82) 100%), linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,0) 50%)",
              boxShadow: "0 24px 80px rgba(0,0,0,.55), inset 0 0 120px rgba(255,255,255,.06)",
              overflow: "hidden",
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1080&auto=format&fit=crop"
              alt="Avatar"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.05) saturate(1.05)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,.0) 0%, rgba(0,0,0,.25) 65%, rgba(0,0,0,.45) 100%)",
              }}
            />
          </div>
        </aside>
      </main>
    </>
  );
}
