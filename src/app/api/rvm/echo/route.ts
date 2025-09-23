export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
    const form = await req.formData();
    const file = form.get("video");
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ ok: false, error: "FormData 'video' file is required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...cors() },
      });
    }
    return new Response(JSON.stringify({
      ok: true,
      size: file.size,
      type: file.type,
      name: file.name,
    }), { status: 200, headers: { "Content-Type": "application/json", ...cors() } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Unknown error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...cors() },
    });
  }
}
