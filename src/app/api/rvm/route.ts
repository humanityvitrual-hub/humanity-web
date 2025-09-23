import Replicate from "replicate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MODEL_VERSION =
  "arielreplicate/robust_video_matting:2d2de06a76a837a4ba92b6164bf8bfd3ddb524a1fb64b0d8ae055af17fa22503";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function POST(req: Request) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return new Response("Missing REPLICATE_API_TOKEN", { status: 503, headers: cors() });
    }
    const form = await req.formData();
    const file = form.get("video");
    if (!(file instanceof File)) {
      return new Response("FormData 'video' is required", { status: 400, headers: cors() });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

    const output: unknown = await replicate.run(MODEL_VERSION, {
      input: { input_video: buffer, output_type: "green-screen" },
    });

    // Normalizamos a URL
    let url: string | undefined;
    if (typeof output === "string") url = output;
    else if (Array.isArray(output) && output.length) url = String(output[0]);
    if (!url) return new Response("No URL in model output", { status: 500, headers: cors() });

    // Descargamos el video procesado y lo reenviamos (misma-origin) para evitar CORS/tainted canvas
    const r = await fetch(url);
    if (!r.ok || !r.body) return new Response("Failed to fetch processed video", { status: 502, headers: cors() });

    const ct = r.headers.get("content-type") ?? "video/mp4";
    return new Response(r.body, {
      status: 200,
      headers: { ...cors(), "Content-Type": ct, "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    return new Response(e?.message ?? "Unknown error", { status: 500, headers: cors() });
  }
}
