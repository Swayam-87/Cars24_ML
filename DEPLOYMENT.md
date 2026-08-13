# 🚀 Cars24 ML Valuation Platform - Complete Live Deployment Guide

This guide provides step-by-step instructions to deploy the **Cars24 ML Car Price Valuation Platform** to **Render** (for the backend API) and **Vercel** (for the frontend landing page or full-stack serverless deployment) without using Docker.

---

## 📋 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Option A: Deploying Backend to Render & Frontend to Vercel (Recommended)](#option-a-deploying-backend-to-render--frontend-to-vercel-recommended)
3. [Option B: Full-Stack Deployment on Vercel](#option-b-full-stack-deployment-on-vercel)
4. [Environment & Configuration Files](#environment--configuration-files)
5. [Testing & Verification](#testing--verification)

---

## 1. Architecture Overview

The repository is structured to support both separate cloud hosting and unified serverless hosting:

- **Backend API**: Built with **Flask 3.1**, loading `saved_model.pkl` via `joblib`, running under **Gunicorn** WSGI web server.
- **Frontend UI**: Responsive HTML5, CSS3 Glassmorphism UI, Chart.js analytics, and REST API tester.
- **ML Model**: Pre-trained Scikit-Learn `LinearRegression` model evaluating car manufacturing year (`year`).

```
Cars24_ML/
├── app.py               # Flask REST API & Vercel entrypoint
├── saved_model.pkl      # Trained Scikit-Learn model file
├── requirements.txt     # Python dependencies
├── Procfile             # Render Gunicorn launch command
├── render.yaml          # Render Blueprint service definition
├── vercel.json          # Vercel serverless & route mappings
├── static/              # Frontend Web UI (HTML, CSS, JS)
└── tests/               # PyTest Automated Unit Tests
```

---

## Option A: Deploying Backend to Render & Frontend to Vercel (Recommended)

### Step 1: Deploy Backend API on Render

1. **Sign up / Log in** to [Render](https://render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub account and select repository: `https://github.com/Swayam87/Cars24_ML`.
4. Configure service settings:
   - **Name**: `cars24-ml-api` (or any custom name)
   - **Region**: Choose region closest to users (e.g., Singapore or Frankfurt)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Click **Create Web Service**.
6. Render will automatically build the service, install packages, load `saved_model.pkl`, and deploy.
7. Once deployed, copy your Render Web Service URL (e.g., `https://cars24-ml-api.onrender.com`).

---

### Step 2: Deploy Frontend UI on Vercel

1. **Sign up / Log in** to [Vercel](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Import repository: `Swayam87/Cars24_ML`.
4. In Framework Preset, select **Other** or **Vite/Static**.
5. Set **Root Directory**: `./` (default).
6. Click **Deploy**.
7. Vercel will host your landing page instantaneously!
8. *(Optional)*: In `static/js/app.js`, if you host the frontend on a different domain than the backend, set `API_BASE_URL` to your Render API URL (`https://cars24-ml-api.onrender.com`).

---

## Option B: Full-Stack Serverless Deployment on Vercel

Vercel natively supports Python Serverless Functions using `@vercel/python`.

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** -> **Project** -> Select `Swayam87/Cars24_ML`.
3. Vercel will automatically detect `vercel.json` and `app.py`.
4. Click **Deploy**.
5. Both the frontend landing page at `/` and backend API at `/api/predict` will be deployed live under a single unified domain (e.g., `https://cars24-ml.vercel.app`)!

---

## Environment & Configuration Files

### `Procfile` (Render)
```procfile
web: gunicorn app:app
```

### `render.yaml` (Render Blueprint)
```yaml
services:
  - type: web
    name: cars24-ml-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app
```

### `vercel.json` (Vercel Serverless)
```json
{
  "version": 2,
  "builds": [
    { "src": "app.py", "use": "@vercel/python" },
    { "src": "static/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "app.py" },
    { "src": "/(.*)", "dest": "static/$1" }
  ]
}
```

---

## Testing & Verification

Before or after deployment, verify API endpoints locally or remotely:

### 1. Health Check
```bash
curl -X GET https://<YOUR-APP-URL>/api/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_type": "LinearRegression",
  "version": "1.0.0"
}
```

### 2. Predict Valuation
```bash
curl -X POST https://<YOUR-APP-URL>/api/predict \
  -H "Content-Type: application/json" \
  -d '{"year": 2022}'
```
**Expected Response:**
```json
{
  "success": true,
  "year": 2022,
  "predicted_price": 1021712.15,
  "formatted_price_inr": "₹ 10,21,712",
  "formatted_lakhs": "₹ 10.22 Lakhs",
  "valuation_range": {
    "min": 980843.66,
    "max": 1062580.64,
    "formatted_min": "₹ 9.81 Lakhs",
    "formatted_max": "₹ 10.63 Lakhs"
  }
}
```

---

🎉 **Congratulations! Your Cars24 ML Valuation Platform is live and ready for production!**
