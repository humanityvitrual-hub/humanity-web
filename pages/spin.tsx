import { useState } from "react";
const API = process.env.NEXT_PUBLIC_PROCESSOR_URL || "";

export default function SpinPage() {
  const [loading, setLoading] = useState(false);
  const [sprite, setSprite] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [ping, setPing] = useState<any>(null);

  async function doPing() {
    try {
      const r = await fetch(`${API}/health`);
      const j = await r.json();
      setPing({ status: r.status, body: j });
    } catch (e:any) {
      setPing(String(e));
    }
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!API) { setError("NEXT_PUBLIC_PROCESSOR_URL not set"); return; }
    setError(null); setSprite(null); setMeta(null); setLoading(true);

    try {
      const fd = new FormData(); fd.append("file", f);
      const r = await fetch(`${API}/process`, { method: "POST", body: fd });
      const text = await r.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      setLoading(false);
      if (!r.ok || !data.ok) { setError(`status=${r.status} → ${JSON.stringify(data)}`); return; }
      setSprite(data.spriteDataUrl); setMeta(data.metadata);
    } catch (e:any) {
      setLoading(false); setError(String(e));
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Create a 360 product from a video</h1>
      <p><b>Processor URL:</b> {API || "(not set)"}</p>

      <button onClick={doPing}>Ping processor</button>
      {ping && <pre>{JSON.stringify(ping, null, 2)}</pre>}

      <input type="file" accept="video/*" onChange={onChange} />
      {loading && <p>Processing…</p>}
      {error && <pre style={{ color: "red" }}>{error}</pre>}
      {sprite && (
        <div>
          <img src={sprite} alt="sprite" style={{ maxWidth: "100%" }} />
          <pre>{JSON.stringify(meta, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
