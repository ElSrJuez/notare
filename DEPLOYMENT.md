# 🚀 Deployment Guide (Google Cloud Always-Free)

> This document explains how to deploy **Notāre** on Google Cloud using the no-cost quotas.
> Sections are independent: follow *Backend* for the API (FastAPI on Cloud Run) and *Frontend* for the static React site (Cloud Storage + optional CDN).

---

## 1  Backend – FastAPI on Cloud Run

### 1.1  Prerequisites
* Google Cloud project with billing enabled (free-tier eligible).
* `gcloud` CLI ≥ 474 installed and authenticated (`gcloud init`).
* Region: **`us-central1`** (counts toward always-free quota).
* Dockerfile already in repo root.

### 1.2  Build & Deploy (source-based)

> The examples below show both **Bash** (`export VAR=value`) and **PowerShell** (`$env:VAR="value"`).

```bash
# Bash
export REGION=us-central1
export SERVICE_NAME=notare-api
```
```powershell
# PowerShell
$env:REGION = "us-central1"
$env:SERVICE_NAME = "notare-api"
```

Then deploy:

```bash
# Bash (single line)
gcloud run deploy "$SERVICE_NAME" --source . --region "$REGION" --platform managed --allow-unauthenticated --memory 256Mi --cpu 1 --port 8080
```
```powershell
# PowerShell (single line)
gcloud run deploy $env:SERVICE_NAME --source . --region $env:REGION --platform managed --allow-unauthenticated --memory 256Mi --cpu 1 --port 8080
```

Cloud Run returns a URL like:
```
https://notare-api-xyz-uc.a.run.app
```

### 1.3  Automated Deployment via PowerShell Script

Instead of manually running gcloud commands, you can use the provided PowerShell script which reads settings from `deployment.ini`:

1. Copy the sample config and edit values:
```powershell
Copy-Item scripts/deployment.sample.ini deployment.ini
# Edit deployment.ini: set SERVICE_NAME, REGION, PROJECT_ID, MEMORY, CPU, ALLOW_UNAUTH, PORT, etc.
```
2. Run the deploy script:
```powershell
.\scripts\deploy.ps1
```

### 1.4  Optional tweaks
* **Environment variables** – add `--set-env-vars KEY=VALUE`.
* **Secrets** – store in Secret Manager, then `--add-cloudsql-instances` or mount via runtime env.
* **Authentication** – omit `--allow-unauthenticated` to require IAM/OIDC.
* **Domain** – map custom domain in Cloud Run → Settings.

---

## 2  Frontend – React SPA on Cloud Storage (+ Cloud CDN)

### 2.1  Build locally
```
cd frontend
npm ci     # first time
npm run build   # outputs to frontend/dist
```

### 2.2  Create static website bucket
```
export BUCKET_NAME=notare-static-site   # choose globally unique name
export REGION=us-central1

gcloud storage buckets create "gs://$BUCKET_NAME" \
  --location "$REGION" \
  --uniform-bucket-level-access

# Configure website meta
 gcloud storage buckets update "gs://$BUCKET_NAME" \
  --web-main-page-suffix index.html \
  --web-error-page 404.html
```

### 2.3  Upload build artifacts
```
# Sync build output (add --delete to remove old files)
gsutil rsync -r frontend/dist "gs://$BUCKET_NAME"
```

### 2.4  Make content public
```
# Allow anonymous READ access to objects only
 gsutil iam ch allUsers:objectViewer "gs://$BUCKET_NAME"
```

Access URL:
```
https://storage.googleapis.com/$BUCKET_NAME/index.html
```

### 2.5  (Recommended) Enable Cloud CDN + HTTPS domain
1. Create HTTPS load balancer with backend bucket `$BUCKET_NAME`.
2. Check *Enable Cloud CDN* during setup (cache-fill within free quota).
3. Attach a managed SSL certificate and custom domain.

---

## 3  Local development via Docker Compose (optional)
A simple `docker-compose.yml` helps replicate the container locally.

```yaml
version: '3.9'
services:
  api:
    build: .
    ports:
      - "8000:8080"
    volumes:
      - ./backend:/app/backend:ro
      - ./assets:/app/assets:ro
```
Run with:
```
docker compose up --build
```
SPA remains served by Vite (`npm run dev`) during dev.

---

## 4  CI/CD ideas
* GitHub Actions → Build container with Cloud Build → Deploy to Cloud Run.
* Separate job builds React, pushes to bucket using `google-github-actions/upload-cloud-storage`.

---

Happy shipping! ✨
