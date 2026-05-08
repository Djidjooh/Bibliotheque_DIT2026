FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc g++ libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --prefix=/install --no-cache-dir "numpy==1.26.4"
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

FROM python:3.11-slim AS final

WORKDIR /app

COPY --from=builder /install /usr/local

COPY . .

RUN mkdir -p models dvc-pipeline/data /root/.surprise

EXPOSE 3004

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3004"]
