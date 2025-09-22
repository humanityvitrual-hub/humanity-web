import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const upstream = process.env.PROCESSOR_URL;
  if (!upstream) return res.status(500).json({ ok:false, error:"missing PROCESSOR_URL env" });

  try {
    const r = await fetch(`${upstream}/health`, { cache: "no-store" });
    const data = await r.json().catch(()=> ({}));
    res.status(r.status).json({ ok: r.ok, status: r.status, data, upstream });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: String(e), upstream });
  }
}
