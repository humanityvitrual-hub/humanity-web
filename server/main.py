import base64, io, os, platform, json
from typing import List, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

from rembg import remove, new_session

app = FastAPI(title="bgremover")

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

# ---- Sesión global (evita re-descargas y problemas de hilo) ----
SESSION = None
try:
    SESSION = new_session('u2net')
except Exception as e:
    print("u2net_session_error:", repr(e))

class FramesIn(BaseModel):
    frames: List[str]

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

@app.get("/health")
def health() -> Dict[str, Any]:
    return {"ok": True}

@app.post("/echo")
def echo(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {"ok": True, "echo": payload}

@app.get("/diag")
def diag() -> Dict[str, Any]:
    info: Dict[str, Any] = {
        "ok": True,
        "python": platform.python_version(),
        "platform": platform.platform(),
        "env": {
            "U2NET_HOME": os.environ.get("U2NET_HOME"),
        },
        "versions": {},
        "u2net_files": [],
        "ort": {},
        "probe": {},
    }
    try:
        import rembg as _rembg, onnxruntime as ort, numpy as np, PIL
        info["versions"]["rembg"] = getattr(_rembg, "__version__", "unknown")
        info["versions"]["onnxruntime"] = getattr(ort, "__version__", "unknown")
        info["versions"]["numpy"] = getattr(np, "__version__", "unknown")
        info["versions"]["PIL"] = getattr(PIL, "__version__", "unknown")
        info["ort"]["available_providers"] = getattr(ort, "get_available_providers", lambda: [])()
    except Exception as e:
        info["ort"]["import_error"] = repr(e)

    # Lista de modelos descargados
    u2home = os.environ.get("U2NET_HOME", os.path.expanduser("~/.u2net"))
    if os.path.isdir(u2home):
        for root, _, files in os.walk(u2home):
            for f in files:
                if f.endswith(".onnx"):
                    info["u2net_files"].append(os.path.join(root, f))

    # Prueba de inferencia interna 1x1
    try:
        px = Image.new("RGBA", (1,1), (255,255,255,255))
        cut = remove(px, session=SESSION) if SESSION else remove(px)
        info["probe"]["remove_bg_ok"] = True
    except Exception as e:
        info["probe"]["remove_bg_ok"] = False
        info["probe"]["error"] = repr(e)

    return info

@app.post("/remove_bg")
def remove_bg(payload: FramesIn):
    out = []
    for durl in payload.frames:
        try:
            img = _dataurl_to_image(durl)
            MAX = 1024
            if max(img.size) > MAX:
                img.thumbnail((MAX, MAX))
            cut = remove(img, session=SESSION) if SESSION else remove(img)
            out.append(_image_to_dataurl(cut))
        except Exception as e:
            print("remove_bg_error:", repr(e))
            try:
                out.append(_image_to_dataurl(img))
            except Exception:
                px = Image.new("RGBA", (1,1), (0,0,0,0))
                out.append(_image_to_dataurl(px))
    return {"ok": True, "frames": out}
