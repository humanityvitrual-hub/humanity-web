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
    const data = await resp.json().catch(() => null);
    return NextResponse.json({ ok: resp.ok, status: resp.status, data }, { status: resp.ok ? 200 : resp.status });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
