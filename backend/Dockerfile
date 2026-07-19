# ponytail: Python-only image (cpsat + neal). Add a rust build stage for the
# optitwin_kernel wheel if container solve latency ever matters.
FROM python:3.12-slim
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
