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
      return new Response(JSON.stringify({ ok: false, error: "Missing REPLICATE_API_TOKEN" }), {
        status: 503, headers: { "Content-Type": "application/json", ...cors() },
      });
    }
    const form = await req.formData();
    const file = form.get("video");
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ ok: false, error: "FormData 'video' file is required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...cors() },
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

    const pred = await replicate.predictions.create({
      version: MODEL_VERSION,
      input: { input_video: buffer, output_type: "green-screen" },
    });

    if (!pred?.id) {
      return new Response(JSON.stringify({ ok: false, error: "No prediction id" }), {
        status: 500, headers: { "Content-Type": "application/json", ...cors() },
      });
    }
    return new Response(JSON.stringify({ ok: true, id: pred.id }), {
      status: 200, headers: { "Content-Type": "application/json", ...cors() },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Unknown error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...cors() },
    });
  }
}
