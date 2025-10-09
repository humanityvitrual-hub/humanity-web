import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Convierte un dataURL a un File
async function dataUrlToFile(dataUrl: string, fallbackName = "photo.jpg") {
  const m = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!m) throw new Error("Invalid data URL");
  const [, mime, b64] = m;
  const buf = Buffer.from(b64, "base64");
  // Nota: File en runtime node 18+ está disponible globalmente en Next
  const file = new File([buf], fallbackName, { type: mime || "application/octet-stream", lastModified: Date.now() });
  return { file, byteLength: buf.byteLength };
}

export async function POST(req: Request) {
  const key = process.env.KIRI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "Missing KIRI_API_KEY" }, { status: 500 });

  try {
    const inForm = await req.formData();

    const photoNo = inForm.get("photoNo");
    const serialize = inForm.get("serialize");
    const name = inForm.get("name");

    if (!photoNo) {
      return NextResponse.json({ ok: false, error: "photoNo is required" }, { status: 400 });
    }

    let outFile: File | null = null;
    let sizeBytes = 0;

    const imgField = inForm.get("image");
    const dataUrlField = inForm.get("imageDataUrl");

    if (imgField instanceof File) {
      // Clonar bytes del File entrante para evitar streams vacíos
      const buf = await imgField.arrayBuffer();
      sizeBytes = buf.byteLength;
      outFile = new File([buf], imgField.name || "photo.jpg", {
        type: imgField.type || "image/jpeg",
        lastModified: Date.now(),
      });
    } else if (typeof dataUrlField === "string" && dataUrlField.startsWith("data:")) {
      const { file, byteLength } = await dataUrlToFile(dataUrlField, "photo.jpg");
      outFile = file;
      sizeBytes = byteLength;
    } else {
      return NextResponse.json({ ok: false, error: "image or imageDataUrl is required" }, { status: 400 });
    }

    if (!outFile || sizeBytes === 0) {
      return NextResponse.json({ ok: false, error: "Backend received 0 bytes for image" }, { status: 400 });
    }

    // Construir el form para KIRI
    const outForm = new FormData();
    outForm.append("image", outFile, outFile.name);
    outForm.append("photoNo", String(photoNo));
    if (serialize) outForm.append("serialize", String(serialize));
    if (name) outForm.append("name", String(name));

    const r = await fetch("https://api.kiriengine.app/api/v1/open/photo/image", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: outForm,
    });

    const text = await r.text(); // devuelven JSON como texto
    return new Response(text, {
      status: r.status,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
