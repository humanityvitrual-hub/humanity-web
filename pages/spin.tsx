import { useState } from "react";

const API = "https://ninety-crabs-itch.loca.lt"; // <- forzado (sin envs) para aislar el problema

export default function SpinPage() {
  const [loading, setLoading] = useState(false);
  const [sprite, setSprite] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [ping, setPing] = useState<any>(null);

  async function doPing() {
    setPing("…");
    try {
      const r = await fetch(`${API}/health`, { cache: "no-store" });
      const j = await r.json().catch(()=> ({}));
      setPing({ status: r.status, body: j });
    } catch (e:any) {
      setPing(String(e));
    }
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null); setSprite(null); setMeta(null); setLoading(true);

    try {
      const fd = new FormData(); fd.append("file", f);
      const r = await fetch(`${API}/process`, { method: "POST", body: fd });
      const text = await r.text();               // capturamos crudo para debug
      let data: any = {};
      try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 800) + "…" }; }
      setLoading(false);

      if (!r.ok || !data?.ok) {
        setError(`status=${r.status}\n${JSON.stringify(data, null, 2)}`);
        return;
      }
      setSprite(data.spriteDataUrl);
      setMeta(data.metadata);
    } catch (e:any) {
      setLoading(false);
      setError(String(e));
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Create a 360 product from a video (hardwired)</h1>
      <p style={{ opacity: 0.7, marginBottom: 16 }}>
        <b>Processor URL:</b> <code>{API}</code>
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <button onClick={doPing} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>Ping processor</button>
        {ping && <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(ping, null, 2)}</pre>}
      </div>

      <input type="file" accept="video/*" onChange={onChange} />
      {loading && <div style={{ marginTop: 12 }}>Processing…</div>}
      {error && <pre style={{ color: "crimson", fontSize: 12, whiteSpace: "pre-wrap", marginTop: 12 }}>{error}</pre>}

      {sprite && (
        <div style={{ marginTop: 16 }}>
          <img src={sprite} alt="sprite" style={{ maxWidth: "100%", border: "1px solid #ddd", borderRadius: 8 }} />
          <pre style={{ fontSize: 12, marginTop: 12 }}>{JSON.stringify(meta, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
