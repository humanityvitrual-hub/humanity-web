import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Payload = { frames: string[] }; // data URLs (webp) 640x640

async function removeBg(dataUrl: string, apiKey: string) {
  const b64 = dataUrl.split(",")[1] ?? "";
  const blob = Buffer.from(b64, "base64");
  const form = new FormData();
  form.append("image_file", new Blob([blob]), "frame.webp");
  form.append("size", "auto");        // mantiene tamaño, saca fondo
  form.append("crop", "false");       // no recorta aquí; normalizamos luego
  form.append("format", "png");       // necesitamos canal alpha

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: form as any,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`remove.bg ${res.status}: ${txt}`);
  }
  const out = Buffer.from(await res.arrayBuffer());
  return `data:image/png;base64,${out.toString("base64")}`;
}

export async function POST(req: NextRequest) {
  try {
    const { frames } = (await req.json()) as Payload;
    if (!Array.isArray(frames) || frames.length !== 36) {
      return NextResponse.json({ error: "need 36 frames" }, { status: 400 });
    }
    const key = process.env.REMOVE_BG_API_KEY;
    if (!key) return NextResponse.json({ error: "REMOVE_BG_API_KEY missing" }, { status: 500 });

    // procesa en tandas para no golpear rate limit
    const batch = 6;
    const result: string[] = [];
    for (let i = 0; i < frames.length; i += batch) {
      const chunk = frames.slice(i, i + batch);
      const done = await Promise.all(chunk.map((f) => removeBg(f, key)));
      result.push(...done);
    }
    return NextResponse.json({ frames: result });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
