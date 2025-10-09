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

// Crea sesión en KIRI y devuelve `serialize`
async function createKiriSession(key: string) {
  // KIRI suele aceptar POST vacío para crear el modelo
  const fd = new FormData();
  const r = await fetch("https://api.kiriengine.app/api/v1/open/model/create", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: fd,
    cache: "no-store",
  });
  const txt = await r.text();
  let json: any;
  try { json = JSON.parse(txt); } catch { json = { raw: txt }; }
  if (!r.ok) {
    const msg = (json && (json.error || json.msg)) || `HTTP ${r.status}`;
    throw new Error(`KIRI create failed: ${msg}`);
  }
  const serialize = json?.data?.serialize ?? json?.serialize;
  if (!serialize) throw new Error("KIRI create: missing serialize in response");
  return { serialize, raw: json };
}

export async function POST(req: Request) {
  const key = process.env.KIRI_API_KEY;
  if (!key) return NextResponse.json({ ok:false, error:"Missing KIRI_API_KEY" }, { status:500 });

  try {
    const inForm = await req.formData();

    // Campos (pueden venir vacíos)
    let photoNo = String(inForm.get("photoNo") ?? "");
    let serialize = String(inForm.get("serialize") ?? "");
    const name = String(inForm.get("name") ?? "") || `Frame ${photoNo || "1"}`;

    // 1) Ingerir imagen desde `image` (File) o `imageDataUrl`
    let incomingFile = inForm.get("image") as File | null;
    if (!incomingFile) {
      const imageDataUrl = inForm.get("imageDataUrl");
      if (typeof imageDataUrl === "string" && imageDataUrl.startsWith("data:")) {
        const { bytes, type } = fromDataUrlToBytes(imageDataUrl);
        if (bytes.length === 0) {
          return NextResponse.json({ ok:false, error:`Zero-byte imageDataUrl` }, { status:400 });
        }
        incomingFile = new File([bytes], `photo_${photoNo || "1"}.jpg`, { type });
      }
    }
    if (!incomingFile) {
      return NextResponse.json({ ok:false, error:"Missing image or imageDataUrl" }, { status:400 });
    }

    // 2) Materializa y valida tamaño
    const ab = await incomingFile.arrayBuffer();
    const bytes = new Uint8Array(ab);
    if (bytes.length === 0) {
      return NextResponse.json({ ok:false, error:`Zero-byte after arrayBuffer()` }, { status:400 });
    }

    // 3) Si no hay serialize, lo creamos ahora
    let createdSessionInfo: any = null;
    if (!serialize) {
      const created = await createKiriSession(key);
      serialize = created.serialize;
      createdSessionInfo = created.raw;
    }

    // 4) Normaliza photoNo
    if (!photoNo) photoNo = "1";

    // 5) Reconstruye File “sólido”
    const ct = incomingFile.type || "image/jpeg";
    const fname = (incomingFile as any).name || `photo_${photoNo}.jpg`;
    const solidFile = new File([bytes], fname, { type: ct, lastModified: Date.now() });

    // 6) Arma el form hacia KIRI
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

    // 7) Devolvemos serialize (nuevo o el que enviaron) para que el frontend lo reutilice
    return NextResponse.json({
      ok:true,
      uploadedBytes: bytes.length,
      serialize,
      createdSessionInfo,
      kiriresp: json
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ ok:false, error: String(err?.message || err) }, { status:500 });
  }
}
