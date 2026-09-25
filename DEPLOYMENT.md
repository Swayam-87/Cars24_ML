# 🚀 Cars24 Decision Tree ML Valuation Platform - Complete Live Deployment Guide

This guide provides step-by-step instructions to deploy the upgraded **Cars24 Decision Tree ML Car Price Valuation Platform** to **Render** (for the backend Python API) and **Vercel** (for the frontend landing page or full-stack serverless deployment) without using Docker.

---

## 📋 Table of Contents
1. [Architecture Overview & Model Specs](#1-architecture-overview--model-specs)
2. [Option A: Deploying Backend to Render & Frontend to Vercel (Recommended)](#option-a-deploying-backend-to-render--frontend-to-vercel-recommended)
3. [Option B: Full-Stack Deployment on Vercel](#option-b-full-stack-deployment-on-vercel)
4. [Option C: Deploy directly via Terminal with Vercel CLI](#option-c-deploy-directly-via-terminal-with-vercel-cli)
5. [Environment & Configuration Files](#environment--configuration-files)
6. [Testing & Verification](#testing--verification)

---

## 1. Architecture Overview & Model Specs

The platform has been upgraded to a multi-feature **Decision Tree Regressor** engine:

- **ML Algorithm**: Scikit-Learn `DecisionTreeRegressor` with `ColumnTransformer` (One-Hot Encoding for categoricals).
- **Model Accuracy Score ($R^2$)**: **91.92%** on the full automotive sales dataset (`cars.csv`).
- **Out-of-Sample Test $R^2$**: **65.27%**.
- **Mean Absolute Error (MAE)**: ~₹ 2.13 Lakhs.
- **Features Used (7 Variables)**:
  - `brand` (e.g. Maruti, Hyundai, Honda, Toyota, Tata, Mahindra, BMW, etc.)
  - `year` (Manufacturing Year, 1990 - 2030)
  - `km_driven` (Odometer mileage)
  - `fuel` (Petrol, Diesel, CNG, LPG)
  - `seller_type` (Individual, Dealer, Trustmark Dealer)
  - `transmission` (Manual, Automatic)
  - `owner` (First Owner, Second Owner, Third Owner, Fourth & Above, Test Drive Car)

```
Cars24_ML/
├── cars.csv             # Multi-feature automotive sales dataset (571 records)
├── train_model.py       # Script to train DecisionTreeRegressor & export metadata
├── saved_model.pkl      # Serialized Decision Tree model & accuracy score package
├── app.py               # Flask REST API & Vercel serverless entrypoint
├── requirements.txt     # Python dependencies
├── Procfile             # Render Gunicorn launch command
├── render.yaml          # Render Blueprint service definition
├── vercel.json          # Vercel serverless & route mappings
├── static/              # Glassmorphism Frontend Web UI
│   ├── index.html       # Landing page with multi-feature studio & accuracy score badge
│   ├── css/style.css    # Premium dark theme & responsive styles
│   └── js/app.js        # Dynamic valuation logic & Chart.js depreciation curves
└── tests/               # PyTest test suite (11 unit & integration tests)
```

---

## Option A: Deploying Backend to Render & Frontend to Vercel (Recommended)

### Step 1: Deploy Backend API on Render

1. Log in to [Render](https://render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub account and select repository: `https://github.com/Swayam-87/Cars24_ML`.
4. Configure service settings:
   - **Name**: `cars24-ml-api` (or any custom name)
   - **Region**: Choose region closest to your users (e.g., Singapore, Frankfurt, or Oregon)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Click **Create Web Service**.
6. Render will automatically build the service, install dependencies, load `saved_model.pkl`, and deploy.
7. Once deployment succeeds, copy your Render Web Service URL (e.g., `https://cars24-ml-api.onrender.com`).

---

### Step 2: Deploy Frontend UI on Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `Swayam-87/Cars24_ML`.
4. In Framework Preset, select **Other** (or default).
5. Set **Root Directory**: `./` (default).
6. Click **Deploy**.
7. Vercel will host your landing page instantaneously!
8. *(Optional)*: If you want the frontend on Vercel to point directly to the Render backend, update `API_BASE_URL` in `static/js/app.js` to your Render API URL (`https://cars24-ml-api.onrender.com`).

---

## Option B: Full-Stack Deployment on Vercel

Vercel natively supports Python serverless functions via `@vercel/python`.

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** -> **Project** -> Select `Swayam-87/Cars24_ML`.
3. Vercel will automatically read `vercel.json` and `app.py`.
4. Click **Deploy**.
5. Both the frontend landing page at `/` and backend API endpoints (`/api/predict`, `/api/health`, `/api/model_info`, `/api/predict_range`) will be live under a single unified URL (e.g., `https://cars24-ml.vercel.app`)!

---

## Option C: Deploy directly via Terminal with Vercel CLI

If you have Node.js installed, you can deploy in one command without leaving your terminal:

```bash
npx vercel
```
1. Follow the interactive prompts (Link to existing project: No, Project name: `cars24-ml`).
2. To deploy to production:
```bash
npx vercel --prod
```

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

### 1. Health & Accuracy Check
```bash
curl -X GET https://<YOUR-APP-URL>/api/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_type": "Decision Tree Regressor",
  "accuracy_score": 91.92,
  "accuracy_metric": "R2 Score (Coefficient of Determination)",
  "features": ["brand", "year", "km_driven", "fuel", "seller_type", "transmission", "owner"],
  "version": "2.0.0"
}
```

### 2. Multi-Feature Valuation Prediction
```bash
curl -X POST https://<YOUR-APP-URL>/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Hyundai",
    "year": 2018,
    "km_driven": 35000,
    "fuel": "Diesel",
    "seller_type": "Individual",
    "transmission": "Manual",
    "owner": "First Owner"
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "inputs": {
    "brand": "Hyundai",
    "year": 2018,
    "km_driven": 35000,
    "fuel": "Diesel",
    "seller_type": "Individual",
    "transmission": "Manual",
    "owner": "First Owner"
  },
  "predicted_price": 750000.0,
  "formatted_price_inr": "₹ 7,50,000",
  "formatted_lakhs": "₹ 7.50 Lakhs",
  "valuation_range": {
    "min": 712500.0,
    "max": 787500.0,
    "formatted_min": "₹ 7.13 Lakhs",
    "formatted_max": "₹ 7.88 Lakhs"
  },
  "model_metadata": {
    "algorithm": "Decision Tree Regressor",
    "accuracy_score": "91.92%",
    "accuracy_score_num": 91.92
  }
}
```

---

🎉 **Congratulations! Your upgraded Cars24 ML Decision Tree platform is production-ready!**
