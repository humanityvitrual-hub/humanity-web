import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const key = process.env.KIRI_API_KEY;
  if (!key) return NextResponse.json({ ok:false, error:"Missing KIRI_API_KEY" }, { status:500 });

  const inForm = await req.formData();
  const files = inForm.getAll("imagesFiles") as File[];

  if (!files?.length) {
    return NextResponse.json({ ok:false, error:"No imagesFiles[]" }, { status:400 });
  }

  // reenviamos 1:1 a KIRI
  const body = new FormData();
  for (const f of files) body.append("imagesFiles", f, (f as File).name || "frame.jpg");

  // Parámetros típicos (ajústalos si quieres)
  body.append("modelQuality", "1");       // 0=High,1=Medium,2=Low,3=Ultra
  body.append("textureQuality", "1");     // 0=4K,1=2K,2=1K,3=8K
  body.append("fileFormat", "glb");       // queremos glb
  body.append("isMask", "1");             // Auto Mask ON
  body.append("textureSmoothing", "1");   // suavizado ON

  const r = await fetch("https://api.kiriengine.app/api/v1/open/photo/image", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body,
  });

  const json = await r.json().catch(() => null);
  if (!r.ok || !json?.data?.serialize) {
    return NextResponse.json({ ok:false, status:r.status, json }, { status:r.status || 500 });
  }
  return NextResponse.json({ ok:true, serialize: json.data.serialize });
}
