import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const key = process.env.KIRI_API_KEY;
  if (!key) return NextResponse.json({ ok:false, error:"Missing KIRI_API_KEY" }, { status:500 });

  const { searchParams } = new URL(req.url);
  const serialize = searchParams.get("serialize");
  if (!serialize) return NextResponse.json({ ok:false, error:"Missing serialize" }, { status:400 });

  const r = await fetch(
    `https://api.kiriengine.app/api/v1/open/model/status?serialize=${encodeURIComponent(serialize)}`,
    { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" },
  );

  const json = await r.json().catch(() => null);
  return NextResponse.json(json ?? { ok:false }, { status: r.ok ? 200 : r.status });
}
