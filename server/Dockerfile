FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libgomp1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server/requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY server/ .

# Render (Docker) expone el puerto en $PORT. Uvicorn debe escucharlo.
CMD bash -lc 'uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}'
