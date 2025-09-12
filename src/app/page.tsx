export default function Home() {
  return (
    <main style={{
      minHeight: '100svh',
      background: '#111',
      color: '#0f0',
      display: 'grid',
      placeItems: 'center',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu',
      padding: 40
    }}>
      <div style={{textAlign:'center'}}>
        <div style={{
          fontSize: 40,
          fontWeight: 800,
          background:'#0f0',
          color:'#111',
          padding:'10px 16px',
          borderRadius:12,
          marginBottom:16
        }}>
          TEST HOME OVERRIDE
        </div>
        <p>Si ves este texto en / (Vercel), el archivo activo es <code>src/app/page.tsx</code>.</p>
      </div>
    </main>
  );
}
