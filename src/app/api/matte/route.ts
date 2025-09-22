import { NextRequest, NextResponse } from "next/server";
const REPLICATE = process.env.REPLICATE_API_TOKEN;

export async function GET() {
  return NextResponse.json({ ok: !!REPLICATE });
}

type Payload = { frames: string[] };

async function removeBg(dataUrl: string) {
  if (!REPLICATE) throw new Error("Missing REPLICATE_API_TOKEN");
  const b64 = dataUrl.split(",")[1];

  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Token ${REPLICATE}` },
    body: JSON.stringify({ version: "rembg", input: { image: `data:image/webp;base64,${b64}`, background: "transparent" } }),
  });
  if (!create.ok) throw new Error(await create.text());
  const created = await create.json();
  const url = created.urls?.get as string;

  for (let i = 0; i < 60; i++) {
    const r = await fetch(url, { headers: { Authorization: `Token ${REPLICATE}` } });
    const j = await r.json();
    if (j.status === "succeeded" && j.output) {
      const outUrl = Array.isArray(j.output) ? j.output[0] : j.output;
      const img = await fetch(outUrl);
      const buf = Buffer.from(await img.arrayBuffer());
      return `data:image/png;base64,${buf.toString("base64")}`;
    }
    if (j.status === "failed") throw new Error("replicate failed");
    await new Promise((res) => setTimeout(res, 1000));
  }
  throw new Error("replicate timeout");
}

export async function POST(req: NextRequest) {
  try {
    const { frames } = (await req.json()) as Payload;
    if (!Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json({ error: "frames[] required" }, { status: 400 });
    }
    const out: string[] = [];
    for (const f of frames) out.push(await removeBg(f));
    return NextResponse.json({ frames: out });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
