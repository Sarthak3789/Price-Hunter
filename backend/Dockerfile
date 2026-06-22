# Use the official Microsoft Playwright image which has all dependencies pre-installed
FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# The base image already has the OS dependencies, we just need to ensure Chromium is downloaded
RUN playwright install chromium

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
