import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const key = process.env.KIRI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok:false, error:"Missing KIRI_API_KEY" }, { status:500 });
  }
  try {
    const r = await fetch("https://api.kiriengine.app/api/v1/open/model/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "photo" }),
    });
    const data = await r.json();
    if (!r.ok || !data?.data?.serialize) {
      throw new Error(`KIRI create failed: ${data?.msg || r.statusText}`);
    }
    return NextResponse.json({ ok:true, serialize: data.data.serialize });
  } catch (err) {
    return NextResponse.json({ ok:false, error:String(err) }, { status:500 });
  }
}
