"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";

const Earth = dynamic(() => import("@/components/Earth"), { ssr: false });

export default function Home() {
  return (
    <>
      {/* Header fijo */}
      <div style={{
        position:'fixed', inset:'0 0 auto 0', zIndex:30, width:'100%',
        backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', height:64
      }}>
        <div style={{
          maxWidth:1120, margin:'0 auto', padding:'14px 24px',
          display:'flex', justifyContent:'space-between', alignItems:'center'
        }}>
          <Link href="/" style={{fontWeight:700, letterSpacing:'.14em', fontSize:14, color:'#fff', textDecoration:'none'}}>
            HUMANITY
          </Link>
          <nav style={{display:'flex', gap:18}}>
            <Link href="/" style={{color:'#fff'}}>Home</Link>
            <Link href="/shop" style={{color:'#fff'}}>Shop</Link>
            <Link href="/about" style={{color:'#fff'}}>About</Link>
            <Link href="/auth/sign-in" style={{
              background:'#fff', color:'#000', padding:'10px 16px',
              borderRadius:12, fontWeight:600, textDecoration:'none'
            }}>Sign in</Link>
          </nav>
        </div>
      </div>

      {/* Fondo 3D */}
      <div style={{position:'fixed', inset:0, zIndex:0}}><Earth/></div>
      <div style={{
        position:'fixed', inset:0, zIndex:5, pointerEvents:'none',
        background:'radial-gradient(ellipse at 35% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,.25) 55%, rgba(0,0,0,.85) 100%)'
      }}/>

      {/* OFFSET global del hero */}
      <div style={{ paddingTop: 220 }}>
        <main style={{
          position:'relative', zIndex:10, maxWidth:1120, margin:'0 auto',
          padding:'0 24px 32px', display:'grid', gridTemplateColumns:'1fr', gap:32, alignItems:'center'
        }}>
          {/* Bloque izquierdo — con refuerzo extra */}
          <section style={{ maxWidth:640, marginTop: 20 }}>
            <h1 style={{
              margin:0, fontSize:64, lineHeight:1.05, fontWeight:800, letterSpacing:'-.02em',
              textShadow:'0 6px 24px rgba(0,0,0,.45)'
            }}>
              Explore the World<br/>in 3D
            </h1>
            <p style={{ marginTop:18, opacity:.92, fontSize:18, textShadow:'0 4px 16px rgba(0,0,0,.35)' }}>
              A virtual reality e-commerce platform.
            </p>

            <div style={{ marginTop:28, display:'flex', flexWrap:'wrap', gap:12 }}>
              <Link href="/my-world" style={{
                display:'inline-block', background:'#fff', color:'#000', fontWeight:700,
                padding:'14px 22px', borderRadius:14, textDecoration:'none',
                boxShadow:'0 8px 28px rgba(255,255,255,.12)'
              }}>
                Get Started
              </Link>
              <Link href="/about" style={{
                display:'inline-block', border:'1px solid rgba(255,255,255,.25)', color:'#fff',
                padding:'14px 22px', borderRadius:14, textDecoration:'none', background:'rgba(255,255,255,.02)'
              }}>
                Learn More
              </Link>
            </div>

            <p style={{ marginTop:42, fontSize:12, opacity:.65 }}>
              © {new Date().getFullYear()} Humanity — Your Own World
            </p>
          </section>

          {/* Panel derecho visible en desktop */}
          <aside style={{ display:'none' }}>
            <div style={{
              position:'relative', height:540, width:420, marginLeft:'auto',
              borderRadius:22, overflow:'hidden',
              background:'radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,.05) 0%, rgba(0,0,0,.4) 60%, rgba(0,0,0,.8) 100%)',
              border:'1px solid rgba(255,255,255,.1)',
              boxShadow:'0 24px 80px rgba(0,0,0,.55), inset 0 0 120px rgba(255,255,255,.06)'
            }}>
              <Image src="/images/assistant.jpg" alt="Assistant" fill sizes="420px" style={{objectFit:'cover'}}
                onError={(e)=>((e.currentTarget as HTMLImageElement).style.display='none')} />
            </div>
          </aside>
        </main>
      </div>

      <style jsx>{`
        @media (min-width:1024px){
          main{ grid-template-columns:1.1fr 0.9fr; }
          aside{ display:block !important; }
        }
      `}</style>
    </>
  );
}
