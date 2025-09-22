import { useState } from "react";

export default function SpinPage() {
  const [loading, setLoading] = useState(false);
  const [sprite, setSprite] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(null); setSprite(null); setMeta(null); setLoading(true);
    const fd = new FormData(); fd.append("file", f);
    const r = await fetch("/api/process-360", { method: "POST", body: fd });
    const data = await r.json().catch(() => ({}));
    setLoading(false);
    if (!r.ok || !data?.ok) { setErr(JSON.stringify(data)); return; }
    setSprite(data.spriteDataUrl); setMeta(data.metadata);
  }

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <h1 style={{ fontWeight: 700, fontSize: 24, marginBottom: 8 }}>Create a 360 product from a video</h1>
      <p style={{ opacity: 0.7, marginBottom: 16 }}>Upload a short spin video. We segment, stabilize and return a 6×6 sprite.</p>
      <input type="file" accept="video/*" onChange={onChange} />
      {loading && <div style={{ marginTop: 12 }}>Processing…</div>}
      {err && <pre style={{ color: "crimson", fontSize: 12, whiteSpace: "pre-wrap" }}>{err}</pre>}
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
