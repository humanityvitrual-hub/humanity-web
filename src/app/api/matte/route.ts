import { NextRequest, NextResponse } from "next/server";

type Payload = { frames: string[]; format?: "webp"|"png" };
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN!;

/**
 * POST /api/matte
 * body: { frames: dataURL[36], format?: "webp"|"png" }
 * resp: { frames: dataURL[] }  // mismas imágenes con fondo removido
 */
export async function POST(req: NextRequest) {
  try {
    if (!REPLICATE_TOKEN) {
      return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
    }
    const { frames, format = "webp" } = (await req.json()) as Payload;
    if (!Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json({ error: "frames[] required" }, { status: 400 });
    }

    // Utilizamos el endpoint de predicciones de Replicate para el modelo rembg
    // Documentación: https://replicate.com (REST /v1/predictions)
    const results: string[] = [];

    for (const dataUrl of frames) {
      // Convertimos dataURL a blob base64 "image/*"
      const b64 = dataUrl.split(",")[1];
      const input = {
        image: `data:image/webp;base64,${b64}`,
        // El modelo admite transparent background
        background: "transparent"
      };

      const create = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${REPLICATE_TOKEN}`,
        },
        body: JSON.stringify({
          version: "rembg", // alias soportado por Replicate para background removal
          input,
        }),
      });

      if (!create.ok) {
        const t = await create.text();
        throw new Error(`replicate create failed: ${t}`);
      }
      const created = await create.json();
      const url = created.urls?.get as string;

      // Polling hasta terminar
      let output: string | null = null;
      for (let i = 0; i < 60; i++) {
        const r = await fetch(url, {
          headers: { Authorization: `Token ${REPLICATE_TOKEN}` },
        });
        const j = await r.json();
        if (j.status === "succeeded" && j.output) {
          // j.output puede ser una URL; la descargamos y re-emitimos como dataURL
          const outUrl = Array.isArray(j.output) ? j.output[0] : j.output;
          const imgResp = await fetch(outUrl);
          const buf = Buffer.from(await imgResp.arrayBuffer());
          const mime = format === "png" ? "image/png" : "image/webp";
          const outDataUrl = `data:${mime};base64,${buf.toString("base64")}`;
          output = outDataUrl;
          break;
        }
        if (j.status === "failed" || j.status === "canceled") {
          throw new Error(`replicate status: ${j.status}`);
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (!output) throw new Error("replicate timeout");
      results.push(output);
    }

    return NextResponse.json({ frames: results });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
