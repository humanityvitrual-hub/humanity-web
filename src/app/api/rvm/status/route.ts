import Replicate from "replicate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function GET(req: Request) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: "Missing REPLICATE_API_TOKEN" }), {
        status: 503,
        headers: { "Content-Type": "application/json", ...cors() },
      });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ ok: false, error: "Missing id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors() },
      });
    }
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
    const pred = await replicate.predictions.get(id);

    // Cuando termina, output suele ser string o array de strings (URLs)
    let url: string | undefined;
    if (pred?.status === "succeeded") {
      const out = pred.output as any;
      if (typeof out === "string") url = out;
      else if (Array.isArray(out) && out.length) url = String(out[0]);
    }
    return new Response(
      JSON.stringify({ ok: true, status: pred?.status, url }),
      { status: 200, headers: { "Content-Type": "application/json", ...cors() } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors() },
    });
  }
}
