import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok:false, error:"missing file" }, { status:400 });
  }
  const upstream = process.env.PROCESSOR_URL;
  if (!upstream) {
    return NextResponse.json({ ok:false, error:"missing PROCESSOR_URL" }, { status:500 });
  }
  const fd = new FormData();
  fd.append("file", file, "input.mp4");
  const r = await fetch(`${upstream}/process`, { method: "POST", body: fd });
  const data = await r.json().catch(()=>({}));
  return NextResponse.json(data, { status: r.status });
}
