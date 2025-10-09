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

    // KIRI espera: image (file), photoNo (1..N). Opcionales: serialize y name.
    const img = inForm.get("image");
    const photoNo = inForm.get("photoNo");
    const serialize = inForm.get("serialize");
    const name = inForm.get("name");

    if (!(img instanceof Blob)) {
      return NextResponse.json({ ok: false, error: "image is required" }, { status: 400 });
    }
    if (!photoNo) {
      return NextResponse.json({ ok: false, error: "photoNo is required" }, { status: 400 });
    }

    const outForm = new FormData();
    outForm.append("image", img, "photo.jpg");
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
