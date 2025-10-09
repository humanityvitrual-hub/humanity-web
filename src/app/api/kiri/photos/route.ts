import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Utilidad: DataURL -> Uint8Array
function fromDataUrlToBytes(dataUrl: string): { bytes: Uint8Array; type: string } {
  const m = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!m) throw new Error("Bad data URL");
  const [, type, b64] = m;
  const bin = Buffer.from(b64, "base64");
  return { bytes: new Uint8Array(bin), type: type || "image/jpeg" };
}

export async function POST(req: Request) {
  const key = process.env.KIRI_API_KEY;
  if (!key) return NextResponse.json({ ok:false, error:"Missing KIRI_API_KEY" }, { status:500 });

  try {
    const inForm = await req.formData();

    // Campos obligatorios
    const photoNo = String(inForm.get("photoNo") ?? "");
    const serialize = String(inForm.get("serialize") ?? "");
    const name = String(inForm.get("name") ?? "") || `Frame ${photoNo}`;

    if (!photoNo || !serialize) {
      return NextResponse.json({ ok:false, error:"photoNo and serialize are required" }, { status:400 });
    }

    // 1) O bien recibimos image (File)…
    let incomingFile = inForm.get("image") as File | null;

    // …o bien imageDataUrl en texto:
    if (!incomingFile) {
      const imageDataUrl = inForm.get("imageDataUrl");
      if (typeof imageDataUrl === "string" && imageDataUrl.startsWith("data:")) {
        const { bytes, type } = fromDataUrlToBytes(imageDataUrl);
        if (bytes.length === 0) {
          return NextResponse.json({ ok:false, error:`Zero-byte imageDataUrl for photo ${photoNo}` }, { status:400 });
        }
        incomingFile = new File([bytes], `photo_${photoNo}.jpg`, { type });
      }
    }

    if (!incomingFile) {
      return NextResponse.json({ ok:false, error:"Missing image or imageDataUrl" }, { status:400 });
    }

    // 2) Materializamos SIEMPRE el binario (evita streams vacíos)
    const ab = await incomingFile.arrayBuffer();
    const bytes = new Uint8Array(ab);
    if (bytes.length === 0) {
      return NextResponse.json({ ok:false, error:`Zero-byte after arrayBuffer() for photo ${photoNo}` }, { status:400 });
    }

    // 3) Re-creamos File con nombre + content-type correctos
    const ct = incomingFile.type || "image/jpeg";
    const fname = (incomingFile as any).name || `photo_${photoNo}.jpg`;
    const solidFile = new File([bytes], fname, { type: ct, lastModified: Date.now() });

    // 4) Armamos el FormData hacia KIRI
    const outForm = new FormData();
    outForm.append("image", solidFile, solidFile.name);
    outForm.append("photoNo", String(photoNo));
    outForm.append("serialize", serialize);
    outForm.append("name", name);

    const r = await fetch("https://api.kiriengine.app/api/v1/open/photo/image", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: outForm,
      cache: "no-store",
    });

    const txt = await r.text();
    let json: any;
    try { json = JSON.parse(txt); } catch { json = { raw: txt }; }

    if (!r.ok) {
      const msg = (json && (json.error || json.msg)) || `HTTP ${r.status}`;
      return NextResponse.json({ ok:false, error:`KIRI: ${msg}`, kiriresp: json }, { status: r.status });
    }

    return NextResponse.json({ ok:true, uploadedBytes: bytes.length, kiriresp: json }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok:false, error: String(err?.message || err) }, { status:500 });
  }
}
