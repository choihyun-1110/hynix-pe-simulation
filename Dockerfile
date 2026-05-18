FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UPKINSEY_HOST=0.0.0.0
ENV PORT=5173

WORKDIR /app

COPY pyproject.toml README.md LICENSE ./
COPY src ./src
COPY scripts ./scripts
COPY prototype ./prototype
COPY assets ./assets
COPY docs ./docs
COPY examples ./examples

RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir '.[persona]'

EXPOSE 5173

CMD ["python", "scripts/run_upkinsey_server.py"]
