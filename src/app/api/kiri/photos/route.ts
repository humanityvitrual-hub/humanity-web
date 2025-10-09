import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const key = process.env.KIRI_API_KEY;
  if (!key) return NextResponse.json({ ok:false, error:"Missing KIRI_API_KEY" }, { status:500 });

  try {
    // Leer multipart EN TU API
    const form = await req.formData();
    const photoNo = form.get("photoNo");
    const serialize = form.get("serialize");
    const image = form.get("image");

    if (!photoNo || !serialize || !image) {
      return NextResponse.json(
        { ok:false, error:"photoNo, serialize and image are required" },
        { status:400 }
      );
    }

    // Reenviar como multipart a KIRI (NUEVO FormData)
    const fd = new FormData();
    fd.append("photoNo", String(photoNo));
    fd.append("serialize", String(serialize));

    // image puede venir como File/Blob desde el browser
    // le ponemos un nombre por si no lo trae
    const file = image as unknown as File;
    const filename = (file as any)?.name || `frame-${photoNo}.jpg`;
    fd.append("image", file, filename);

    const r = await fetch("https://api.kiriengine.app/api/v1/open/photo/image", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        // NO pongas Content-Type aquí; lo pone el navegador con boundary correcto
      },
      body: fd,
    });

    const data = await r.json();
    if (!r.ok || data?.code !== 200) {
      throw new Error(`KIRI upload failed: ${data?.msg || r.statusText}`);
    }
    return NextResponse.json({ ok:true, data });
  } catch (err) {
    return NextResponse.json({ ok:false, error:String(err) }, { status:500 });
  }
}
