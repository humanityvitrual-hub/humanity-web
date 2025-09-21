import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs'; // necesitamos fs

function sanitize(name: string) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET() {
  // lista rápida de últimos archivos por conveniencia
  const dir = path.join(process.cwd(), 'public', 'spins');
  try {
    const entries = await fs.readdir(dir);
    const files = (await Promise.all(
      entries.map(async (f) => {
        const s = await fs.stat(path.join(dir, f));
        return { name: f, mtime: s.mtimeMs, url: `/spins/${f}` };
      })
    ))
    .filter(f => !f.name.startsWith('.'))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 20);

    return NextResponse.json({ ok: true, files });
  } catch {
    return NextResponse.json({ ok: true, files: [] });
  }
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'No file' }, { status: 400 });
  }
  if (!file.type.startsWith('video/')) {
    return NextResponse.json({ ok: false, error: 'Only video/*' }, { status: 400 });
  }

  const spinsDir = path.join(process.cwd(), 'public', 'spins');
  await fs.mkdir(spinsDir, { recursive: true });

  const ext = path.extname(file.name || '').toLowerCase() || '.mp4';
  const base = path.basename(file.name || 'spin', ext);
  const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const finalName = sanitize(`${base}-${stamp}${ext}`);
  const finalPath = path.join(spinsDir, finalName);

  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(finalPath, buf);

  return NextResponse.json({
    ok: true,
    url: `/spins/${finalName}`,
    filename: finalName,
    size: buf.length,
    type: file.type,
  });
}
