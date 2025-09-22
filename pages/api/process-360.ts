import type { NextApiRequest, NextApiResponse } from "next";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"method not allowed" });

  // Next no parsea multipart: usamos el request sin tocar (req) y reconstruimos con fetch
  const upstream = process.env.PROCESSOR_URL;
  if (!upstream) return res.status(500).json({ ok:false, error:"missing PROCESSOR_URL" });

  // Leemos el cuerpo completo como stream y lo reenviamos tal cual con el mismo content-type
  const contentType = req.headers["content-type"] || "application/octet-stream";
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve());
    req.on("error", reject);
  });
  const body = Buffer.concat(chunks);

  const r = await fetch(`${upstream}/process`, {
    method: "POST",
    headers: { "content-type": String(contentType) },
    body
  });

  const text = await r.text();
  res.status(r.status).send(text);
}
