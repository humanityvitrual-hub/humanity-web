import base64, io
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from rembg import remove

app = FastAPI(title="bgremover")

from server.cors_fix import apply_permissive_cors
apply_permissive_cors(app)


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

def _image_to_dataurl(img: Image.Image, format="PNG", quality=92) -> str:
    # devolvemos PNG con alfa (luego el front lo pinta sobre blanco)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"

@app.post("/remove_bg")
def remove_bg(payload: FramesIn):
    out = []
    for durl in payload.frames:
        img = _dataurl_to_image(durl)
        # rembg (U2Net) – robusto para objetos, sin nube
        cut = remove(img)  # RGBA con alfa
        out.append(_image_to_dataurl(cut))
    return {"ok": True, "frames": out}
