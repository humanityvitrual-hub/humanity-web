import base64, io
from typing import List, Any, Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from rembg import remove

app = FastAPI(title="bgremover")

# CORS abierto (para Vercel preview)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class FramesIn(BaseModel):
    frames: List[str]  # dataURLs (image/webp/png/jpeg), recomendado <= 640px

def _dataurl_to_image(data_url: str) -> Image.Image:
    comma = data_url.find(",")
    if comma != -1:
        data_url = data_url[comma+1:]
    raw = base64.b64decode(data_url)
    img = Image.open(io.BytesIO(raw)).convert("RGBA")
    return img

def _image_to_dataurl(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"

@app.get("/")
def root() -> Dict[str, Any]:
    return {"ok": True, "service": "bgremover"}

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
        img = _dataurl_to_image(durl)
        cut = remove(img)  # RGBA con alfa (U^2Net)
        out.append(_image_to_dataurl(cut))
    return {"ok": True, "frames": out}

# --- endpoints de salud para Render ---
@app.get("/health")
def health():
    return {"ok": True}

@app.post("/echo")
def echo(payload: dict):
    return {"ok": True, "echo": payload}
