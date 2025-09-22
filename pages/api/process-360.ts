import type { NextApiRequest, NextApiResponse } from "next";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"method not allowed" });

  const upstream = process.env.PROCESSOR_URL;
  if (!upstream) return res.status(500).json({ ok:false, error:"missing PROCESSOR_URL" });

  const contentType = req.headers["content-type"] || "application/octet-stream";

  // Leer stream del multipart tal cual
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve());
    req.on("error", reject);
  });
  const body = Buffer.concat(chunks);

  // Timeout de 90s para evitar "quedarse colgado"
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 90_000);

  try {
    const r = await fetch(`${upstream}/process`, {
      method: "POST",
      headers: { "content-type": String(contentType) },
      body,
      signal: ac.signal,
      cache: "no-store",
    });

    const text = await r.text();
    clearTimeout(t);
    // Pasar tal cual lo que responda el servicio (JSON o error)
    res.status(r.status).send(text);
  } catch (e:any) {
    clearTimeout(t);
    res.status(502).json({ ok:false, where:"vercel->processor", error:String(e), upstream });
  }
}
