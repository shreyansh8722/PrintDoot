# ---- Railway Dockerfile for PrintDoot Backend ----
FROM python:3.12-slim

# Env
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (for psycopg2)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Python deps
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ /app/

# Collect static files (needs SECRET_KEY, which Railway injects as env var)
RUN python manage.py collectstatic --noinput 2>/dev/null || true

# Expose the PORT Railway assigns
EXPOSE ${PORT:-8000}

# Run migrations then start gunicorn
CMD sh -c "python manage.py migrate --noinput && gunicorn shop_project.wsgi --bind 0.0.0.0:\${PORT:-8000} --workers 3 --timeout 120"
