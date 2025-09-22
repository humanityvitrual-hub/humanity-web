"use client";
import React, { useState } from "react";

export default function ProcessorClient() {
  const [loading, setLoading] = useState(false);
  const [sprite, setSprite] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(null); setSprite(null); setMeta(null); setLoading(true);
    const fd = new FormData(); fd.append("file", f);
    const r = await fetch("/api/process-360", { method:"POST", body: fd });
    const data = await r.json();
    setLoading(false);
    if (!r.ok || !data?.ok) { setErr(JSON.stringify(data)); return; }
    setSprite(data.spriteDataUrl); setMeta(data.metadata);
  }

  return (
    <div className="space-y-4">
      <input type="file" accept="video/*" onChange={onChange} />
      {loading && <div>Processing…</div>}
      {err && <pre className="text-red-600 text-xs break-words">{err}</pre>}
      {sprite && (
        <div>
          <img src={sprite} alt="sprite" className="w-full h-auto rounded border" />
          <div className="mt-2 flex gap-2">
            <a download="sprite.png" href={sprite} className="px-3 py-1 border rounded">Download sprite</a>
            <a
              download="metadata.json"
              href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(meta,null,2))}`}
              className="px-3 py-1 border rounded"
            >Download metadata</a>
          </div>
          <pre className="text-xs mt-3">{JSON.stringify(meta, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
