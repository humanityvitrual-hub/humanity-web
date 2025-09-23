import base64, io, zipfile
from typing import List, Optional
from fastapi import FastAPI, Request, UploadFile, File, HTTPException, Response
from pydantic import BaseModel
from PIL import Image
from rembg import remove

# --- App + CORS permisivo (incluye OPTIONS universal) ---
from server.cors_fix import apply_permissive_cors

app = FastAPI(title="bgremover")
apply_permissive_cors(app)

# --------- Modelos ----------
class FramesIn(BaseModel):
    frames: List[str]   # dataURLs (image/webp/png/jpeg), tamaño recomendado <= 640px

# --------- Utilidades ----------
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

def _zip_bytes_to_images(zip_bytes: bytes) -> List[Image.Image]:
    images: List[Image.Image] = []
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        # ordena por nombre para mantener secuencia 1..36
        for name in sorted(zf.namelist()):
            if name.endswith("/"):
                continue
            with zf.open(name) as f:
                data = f.read()
                img = Image.open(io.BytesIO(data)).convert("RGBA")
                images.append(img)
    if not images:
        raise HTTPException(status_code=400, detail="ZIP without image files")
    return images

def _process_images_remove_bg(imgs: List[Image.Image]) -> List[str]:
    out: List[str] = []
    for img in imgs:
        cut = remove(img)  # RGBA con alfa
        out.append(_image_to_dataurl(cut))
    return out

# --------- Healthcheck ----------
@app.get("/health")
def health():
    return {"ok": True}

# --------- Endpoint principal (acepta JSON o multipart/zip) ----------
@app.post("/remove_bg")
async def remove_bg(request: Request, zip: Optional[UploadFile] = File(None)):
    ctype = request.headers.get("content-type", "")
    # Caso 1: multipart/form-data con ZIP (lo que envía el front con progreso)
    if "multipart/form-data" in ctype:
        if zip is None:
            raise HTTPException(status_code=400, detail="Missing 'zip' file field")
        data = await zip.read()
        imgs = _zip_bytes_to_images(data)
        frames_out = _process_images_remove_bg(imgs)
        return {"ok": True, "frames": frames_out}

    # Caso 2: JSON {"frames":[dataURL,...]}
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    frames = payload.get("frames")
    if not isinstance(frames, list) or not frames:
        raise HTTPException(status_code=400, detail="Invalid 'frames' field")

    imgs = [_dataurl_to_image(durl) for durl in frames]
    frames_out = _process_images_remove_bg(imgs)
    return {"ok": True, "frames": frames_out}
