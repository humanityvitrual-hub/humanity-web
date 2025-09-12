"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

const Earth = dynamic(() => import("@/components/Earth"), { ssr: false });

export default function Home() {
  return (
    <>
      {/* HEADER */}
      <div style={{
        position:"fixed", inset:"0 0 auto 0", zIndex:30, width:"100%",
        backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)"
      }}>
        <div style={{
          maxWidth:1120, margin:"0 auto", padding:"14px 24px",
          display:"flex", justifyContent:"space-between", alignItems:"center"
        }}>
          <Link href="/" style={{
            fontWeight:700, letterSpacing:".14em", fontSize:14, opacity:.95,
            color:"#fff", textDecoration:"none"
          }}>
            HUMANITY
          </Link>
          <nav style={{display:"flex", gap:18, alignItems:"center"}}>
            <Link href="/" style={{opacity:.9, color:"#fff", textDecoration:"none"}}>Home</Link>
            <Link href="/shop" style={{opacity:.9, color:"#fff", textDecoration:"none"}}>Shop</Link>
            <Link href="/about" style={{opacity:.9, color:"#fff", textDecoration:"none"}}>About</Link>
            <Link href="/auth/sign-in" style={{
              background:"#fff", color:"#000", fontWeight:600, padding:"10px 16px",
              borderRadius:12, textDecoration:"none"
            }}>Sign in</Link>
          </nav>
        </div>
      </div>

      {/* 3D BACKGROUND */}
      <div style={{position:"fixed", inset:0, zIndex:0}}><Earth/></div>
      <div style={{
        position:"fixed", inset:0, zIndex:5, pointerEvents:"none",
        background:"radial-gradient(ellipse at 35% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,.25) 55%, rgba(0,0,0,.85) 100%)"
      }}/>

      {/* HERO */}
      <main style={{
        position:"relative", zIndex:10, minHeight:"100svh",
        padding:"96px 24px 24px", maxWidth:1120, margin:"0 auto",
        display:"grid", gridTemplateColumns:"1fr", alignItems:"center", gap:32
      }}>
        <div style={{maxWidth:640}}>
          <h1 style={{
            margin:0, fontSize:64, lineHeight:1.05, fontWeight:800,
            letterSpacing:"-0.02em", textShadow:"0 6px 24px rgba(0,0,0,.45)"
          }}>
            Explore the World<br/>in 3D
          </h1>
          <p style={{marginTop:18, opacity:.9, fontSize:18, textShadow:"0 4px 16px rgba(0,0,0,.35)"}}>
            A virtual reality e-commerce platform.
          </p>

          <div style={{marginTop:28, display:"flex", flexWrap:"wrap", gap:12}}>
            <Link href="/my-world" style={{
              background:"#fff", padding:"14px 22px", borderRadius:14, textDecoration:"none",
              boxShadow:"0 8px 28px rgba(255,255,255,.12)"
            }}>
              <span style={{color:"#000", fontWeight:700}}>Get Started</span>
            </Link>
            <Link href="/about" style={{
              border:"1px solid rgba(255,255,255,.25)", color:"#fff",
              padding:"14px 22px", borderRadius:14, textDecoration:"none",
              background:"rgba(255,255,255,0.02)"
            }}>
              Learn More
            </Link>
          </div>

          <p style={{marginTop:42, fontSize:12, opacity:.65}}>
            © {new Date().getFullYear()} Humanity — Your Own World
          </p>
        </div>

        {/* AVATAR visible/placeholder */}
        <div style={{position:"relative", height:520, width:360, marginLeft:"auto"}} id="avatar-wrap">
          <div id="avatar-ph" style={{
            position:"absolute", inset:0, borderRadius:24,
            border:"1px solid rgba(255,255,255,.1)",
            background:"radial-gradient(circle at 30% 30%, #444, #111)"
          }}/>
          <Image
            src="/images/assistant.jpg" alt="Assistant" fill sizes="360px"
            style={{
              objectFit:"cover", borderRadius:24, border:"1px solid rgba(255,255,255,.1)",
              boxShadow:"0 20px 60px rgba(0,0,0,.5), inset 0 0 120px rgba(255,255,255,.06)"
            }}
            onLoadingComplete={() => {
              const ph = document.getElementById('avatar-ph'); if (ph) ph.style.display = 'none';
            }}
            onError={() => {/* se queda el placeholder */}}
          />
        </div>
      </main>
    </>
  );
}
