FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# deps de SO necesarias para onnxruntime / rembg / PIL (libgl1) 
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libgomp1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# requisitos del backend
COPY server/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# código del backend
COPY server /app/server

EXPOSE 8000
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
