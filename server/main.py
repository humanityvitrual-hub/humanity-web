import base64, io
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from rembg import remove

app = FastAPI(title="bgremover")

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

def _resize_if_needed(img: Image.Image, max_side=640) -> Image.Image:
    w, h = img.size
    m = max(w, h)
    if m <= max_side:
        return img
    scale = max_side / float(m)
    return img.resize((int(w*scale), int(h*scale)), Image.LANCZOS)

@app.get("/")
@app.get("/health")
def health():
    return {"ok": True, "service": "bgremover"}

@app.post("/echo")
def echo(payload: dict):
    return {"ok": True, "echo": payload}

@app.post("/remove_bg")
def remove_bg(payload: FramesIn):
    out = []
    for durl in payload.frames:
        img = _dataurl_to_image(durl)
        img = _resize_if_needed(img, 640)   # evita timeouts en Render
        cut = remove(img)                   # RGBA con alfa
        out.append(_image_to_dataurl(cut))
    return {"ok": True, "frames": out}
