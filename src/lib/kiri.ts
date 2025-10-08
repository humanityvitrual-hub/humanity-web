export async function sendFramesToKiri(frames: (Blob|File|string)[]) {
  async function toFile(x: Blob|File|string, i:number) {
    if (x instanceof File) return x;
    if (x instanceof Blob) return new File([x], `frame_${String(i+1).padStart(2,'0')}.jpg`, { type: x.type || "image/jpeg" });
    if (typeof x === "string" && x.startsWith("data:")) {
      const b = await fetch(x).then(r => r.blob());
      return new File([b], `frame_${String(i+1).padStart(2,'0')}.jpg`, { type: b.type || "image/jpeg" });
    }
    const b = await fetch(String(x), { cache:"no-store" }).then(r => r.blob());
    return new File([b], `frame_${String(i+1).padStart(2,'0')}.jpg`, { type: b.type || "image/jpeg" });
  }
  const files = await Promise.all(frames.map(toFile));
  const fd = new FormData();
  files.forEach(f => fd.append("imagesFiles", f, f.name));
  const up = await fetch("/api/kiri/photos", { method:"POST", body: fd });
  const uj = await up.json();
  if (!up.ok) throw new Error(JSON.stringify(uj));
  const serialize = uj.serialize as string;
  while (true) {
    await new Promise(r => setTimeout(r, 4000));
    const st = await fetch(`/api/kiri/status?serialize=${serialize}`).then(r => r.json());
    if (st?.data?.status === 2) return { serialize };
    if (st?.data?.status < 0) throw new Error("KIRI failed: " + JSON.stringify(st));
  }
}
