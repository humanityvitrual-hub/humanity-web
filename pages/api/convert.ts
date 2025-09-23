import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import Replicate from "replicate";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Método no permitido");
  try {
    const { files }: any = await new Promise((resolve, reject) => {
      const form = formidable({ multiples: false });
      form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ fields, files }));
    });
    const f = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!f?.filepath) return res.status(400).json({ ok:false, error:"Falta archivo" });

    const stream = fs.createReadStream(f.filepath);
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

    // TripoSR: 1 foto -> malla 3D
    const output = await replicate.run("tripo-ai/triposr", { input: { image: stream as any } });

    let glb: string | undefined;
    if (typeof output === "string" && output.endsWith(".glb")) glb = output;
    if (Array.isArray(output))
      glb = output.find((u: any) => typeof u === "string" && u.endsWith(".glb"));
    if (!glb) return res.status(502).json({ ok:false, output });

    res.json({ ok:true, glb });
  } catch (e: any) {
    res.status(500).json({ ok:false, error: e?.message || e });
  }
}
