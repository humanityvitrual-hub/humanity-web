export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const key = process.env.KIRI_API_KEY;
  if (!key) return new Response("Missing KIRI_API_KEY", { status: 500 });

  const { searchParams } = new URL(req.url);
  const serialize = searchParams.get("serialize");
  const fileFormat = searchParams.get("fileFormat") ?? "glb";
  if (!serialize) return new Response("Missing serialize", { status: 400 });

  const r = await fetch(
    `https://api.kiriengine.app/api/v1/open/model/downloadZip?serialize=${encodeURIComponent(serialize)}&fileFormat=${encodeURIComponent(fileFormat)}`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  if (!r.ok) return new Response(await r.text(), { status: r.status });

  return new Response(r.body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${serialize}.${fileFormat}.zip"`,
    },
  });
}
