import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.KIRI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "Missing KIRI_API_KEY" }, { status: 500 });
  }
  try {
    const resp = await fetch("https://api.kiriengine.app/api/v1/open/balance", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    const txt = await resp.text();
    // Intenta parsear JSON; si no es JSON, devuelve texto crudo con su content-type
    try {
      const data = JSON.parse(txt);
      return NextResponse.json(data, { status: resp.status });
    } catch {
      return new NextResponse(txt, {
        status: resp.status,
        headers: { "content-type": resp.headers.get("content-type") || "text/plain" },
      });
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
