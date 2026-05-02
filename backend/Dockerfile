FROM python:3.12-slim

WORKDIR /app

# install system deps for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
COPY src/ ./src/

RUN pip install --no-cache-dir .

# download the VADER sentiment lexicon so it is available at runtime
RUN python -c "import nltk; nltk.download('vader_lexicon', quiet=True)"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
