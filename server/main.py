import base64, io, os
from typing import List, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

# rembg
from rembg import remove

app = FastAPI(title="bgremover")

# CORS permisivo (preserva tu helper si existe)
try:
    from server.cors_fix import apply_permissive_cors
    apply_permissive_cors(app)
except Exception:
    pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class FramesIn(BaseModel):
    frames: List[str]   # dataURLs (image/webp/png/jpeg), tamaño recomendado <= 640px

def _dataurl_to_image(data_url: str) -> Image.Image:
    comma = data_url.find(",")
    if comma != -1:
        data_url = data_url[comma+1:]
    raw = base64.b64decode(data_url)
    img = Image.open(io.BytesIO(raw)).convert("RGBA")
    return img

def _image_to_dataurl(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")  # devolvemos PNG con alfa
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"

@app.get("/health")
def health() -> Dict[str, Any]:
    return {"ok": True}

@app.post("/echo")
def echo(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {"ok": True, "echo": payload}

@app.post("/remove_bg")
def remove_bg(payload: FramesIn):
    out = []
    for durl in payload.frames:
        try:
            img = _dataurl_to_image(durl)

            # Sanidad: limita resolución para que ONNX no truene en instancias chicas
            MAX = 1024
            if max(img.size) > MAX:
                img.thumbnail((MAX, MAX))

            # rembg (U²Net)
            cut = remove(img)  # RGBA con alfa
            out.append(_image_to_dataurl(cut))
        except Exception as e:
            # Fallback: devuelve la imagen original en PNG con alfa, no 500
            print("remove_bg_error:", repr(e))
            try:
                out.append(_image_to_dataurl(img))
            except Exception:
                # Si ni siquiera pudimos decodificar, devuelvo un pixel transparente
                px = Image.new("RGBA", (1,1), (0,0,0,0))
                out.append(_image_to_dataurl(px))
    return {"ok": True, "frames": out}
