import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

type Payload = {
  frames: string[];              // 36 imágenes cuadradas (dataURL o URLs)
  background?: "transparent" | "white";
  tile?: number;                  // por defecto 6
};

export const runtime = "nodejs";  // importante: no usar 'edge'

export async function POST(req: NextRequest) {
  try {
    const { frames, background = "transparent", tile = 6 } = (await req.json()) as Payload;

    if (!frames?.length) return NextResponse.json({ error: "No frames" }, { status: 400 });
    if (frames.length !== 36) return NextResponse.json({ error: "Expecting 36 frames" }, { status: 400 });

    const firstBuf = await toBuffer(frames[0]);
    const meta = await sharp(firstBuf).metadata();
    const size = Math.min(meta.width ?? 0, meta.height ?? 0);
    if (!size) return NextResponse.json({ error: "Invalid frame size" }, { status: 400 });

    const cols = tile;                  // 6
    const rows = tile;                  // 6
    const cellW = size;
    const cellH = size;
    const sheetW = cellW * cols;
    const sheetH = cellH * rows;

    const composites: sharp.OverlayOptions[] = [];
    for (let i = 0; i < frames.length; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const buf = await toBuffer(frames[i]);
      composites.push({ input: buf, top: r * cellH, left: c * cellW });
    }

    let canvas = sharp({
      create: {
        width: sheetW,
        height: sheetH,
        channels: 4,
        background: background === "white"
          ? { r: 255, g: 255, b: 255, alpha: 1 }
          : { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    const sprite = await canvas.composite(composites).webp({ quality: 90 }).toBuffer();

    const manifest = {
      frames: 36,
      cols,
      rows,
      cell: { w: cellW, h: cellH },
      order: "row-major",
      format: "webp",
    };

    return NextResponse.json({
      sprite: `data:image/webp;base64,${sprite.toString("base64")}`,
      manifest,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "error" }, { status: 500 });
  }
}

async function toBuffer(src: string): Promise<Buffer> {
  if (src.startsWith("data:")) {
    const base64 = src.split(",")[1]!;
    return Buffer.from(base64, "base64");
  }
  const r = await fetch(src);
  if (!r.ok) throw new Error(`fetch ${src} failed`);
  return Buffer.from(await r.arrayBuffer());
}
