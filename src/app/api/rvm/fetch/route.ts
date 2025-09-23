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
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url) return new Response("Missing url", { status: 400, headers: cors() });

    const r = await fetch(url);
    if (!r.ok || !r.body) return new Response("Upstream fetch failed", { status: 502, headers: cors() });

    const ct = r.headers.get("content-type") ?? "video/mp4";
    return new Response(r.body, { status: 200, headers: { ...cors(), "Content-Type": ct, "Cache-Control": "no-store" } });
  } catch (e: any) {
    return new Response(e?.message ?? "Unknown error", { status: 500, headers: cors() });
  }
}
