import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const key = process.env.KIRI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "Missing KIRI_API_KEY" }, { status: 500 });
  }

  try {
    const inForm = await req.formData();

    // Campos esperados
    const imgField = inForm.get("image");
    const photoNo = inForm.get("photoNo");
    const serialize = inForm.get("serialize");
    const name = inForm.get("name");

    if (!(imgField instanceof File)) {
      return NextResponse.json({ ok: false, error: "image is required" }, { status: 400 });
    }
    if (!photoNo) {
      return NextResponse.json({ ok: false, error: "photoNo is required" }, { status: 400 });
    }

    // ⚠️ CLONAR BYTES: leer el File entrante y recrear un Blob/File nuevo
    const buf = await imgField.arrayBuffer();
    const cloned = new File([buf], imgField.name || "photo.jpg", {
      type: imgField.type || "image/jpeg",
      lastModified: Date.now(),
    });

    // Construir el form para KIRI
    const outForm = new FormData();
    outForm.append("image", cloned, cloned.name);
    outForm.append("photoNo", String(photoNo));
    if (serialize) outForm.append("serialize", String(serialize));
    if (name) outForm.append("name", String(name));

    const r = await fetch("https://api.kiriengine.app/api/v1/open/photo/image", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: outForm,
    });

    const text = await r.text(); // KIRI devuelve JSON como texto
    return new Response(text, {
      status: r.status,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
