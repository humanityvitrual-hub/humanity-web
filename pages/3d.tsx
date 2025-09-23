import { useState, useEffect } from "react";

export default function Page() {
  const [glb, setGlb] = useState<string>("");

  useEffect(() => {
    const s = document.createElement("script");
    s.type = "module";
    s.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  async function convert() {
    const input = document.getElementById("file") as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) { alert("Elige una imagen"); return; }
    const fd = new FormData(); fd.append("file", f);
    const res = await fetch("/api/convert", { method:"POST", body: fd });
    if (!res.ok) { alert("Fallo en conversión"); return; }
    const json = await res.json(); setGlb(json.glb);
  }

  return (
    <div style={{maxWidth:960,margin:"40px auto",padding:"0 16px",color:"#eee"}}>
      <h2>Convierte tu producto a 3D</h2>
      <input id="file" type="file" accept="image/*" />
      <button onClick={convert} style={{marginLeft:12,padding:"8px 14px"}}>Convertir a 3D</button>
      <div style={{height:24}}/>
      {glb && (
        <>
          <model-viewer src={glb} camera-controls ar ar-modes="webxr scene-viewer quick-look"
            style={{width:"100%",height:"70vh",background:"#0b0c10",borderRadius:16}}></model-viewer>
          <p><a href={glb} download>Descargar GLB</a></p>
        </>
      )}
    </div>
  );
}
