FROM python:3.11-slim

# libs comunes que rembg/onnxruntime suelen necesitar
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libgl1 libstdc++6 libgomp1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r /app/server/requirements.txt

COPY server /app/server

# Render nos da $PORT; en local usa 10000
CMD uvicorn server.main:app --host 0.0.0.0 --port ${PORT:-10000}
