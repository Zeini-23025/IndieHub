FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install pip, setuptools, and wheel, then install requirements
# setuptools must remain installed as it provides pkg_resources at runtime
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt gunicorn

COPY . .

EXPOSE 8000

# Make sure the entrypoint script (created below) is executable and use it to run
# migrations, populate the DB, then exec the main CMD (gunicorn).
RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]

CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]