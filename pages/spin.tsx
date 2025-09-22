import { useState } from "react";

const U = process.env.NEXT_PUBLIC_PROCESSOR_URL || "";

export default function SpinPage() {
  const [loading, setLoading] = useState(false);
  const [sprite, setSprite] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ping, setPing] = useState<any>(null);

  async function doPing() {
    setPing("…");
    try {
      const r = await fetch(`${U}/health`, { cache: "no-store" });
      const j = await r.json().catch(()=> ({}));
      setPing({ status: r.status, body: j });
    } catch (e: any) {
      setPing(String(e));
    }
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!U) { setErr("NEXT_PUBLIC_PROCESSOR_URL NO está definida en este preview"); return; }
    setErr(null); setSprite(null); setMeta(null); setLoading(true);

    try {
      const fd = new FormData(); fd.append("file", f);
      const r = await fetch(`${U}/process`, { method: "POST", body: fd });
      const text = await r.text(); // <-- lee texto para ver qué llega exactamente
      let data: any = {};
      try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) + "…" }; }
      console.log("PROCESS RESP:", { status: r.status, data });
      setLoading(false);
      if (!r.ok || !data?.ok) { setErr(`status=${r.status} data=${JSON.stringify(data).slice(0,500)}`); return; }
      setSprite(data.spriteDataUrl); setMeta(data.metadata);
    } catch (e:any) {
      setLoading(false);
      setErr(String(e));
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <h1 style={{ fontWeight: 700, fontSize: 24, marginBottom: 8 }}>Create a 360 product from a video</h1>
      <p style={{ opacity: 0.7, marginBottom: 16 }}>
        Direct upload → processor (CORS).<br/>
        <b>Processor URL:</b> <code>{U || "(vacía)"}</code>
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <button onClick={doPing} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>Ping processor</button>
        {ping && <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(ping, null, 2)}</pre>}
      </div>

      <input type="file" accept="video/*" onChange={onChange} />
      {loading && <div style={{ marginTop: 12 }}>Processing… (mira Console/Network si tarda)</div>}
      {err && <pre style={{ color: "crimson", fontSize: 12, whiteSpace: "pre-wrap", marginTop: 12 }}>{err}</pre>}
      {sprite && (
        <div style={{ marginTop: 16 }}>
          <img src={sprite} alt="sprite" style={{ maxWidth: "100%", border: "1px solid #ddd", borderRadius: 8 }} />
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <a download="sprite.png" href={sprite} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>Download sprite</a>
            <a
              download="metadata.json"
              href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(meta,null,2))}`}
              style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}
            >Download metadata</a>
          </div>
          <pre style={{ fontSize: 12, marginTop: 12 }}>{JSON.stringify(meta, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
