FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    U2NET_HOME=/root/.u2net

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libgomp1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/requirements.txt /app/requirements.txt
RUN python -m pip install --upgrade pip && pip install -r requirements.txt

COPY server /app/server

# Precarga del modelo en build para evitar descarga en el primer hit
RUN python - <<'PY'
from rembg import new_session
new_session('u2net')
print('U2Net ready')
PY

EXPOSE 10000
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "10000"]
