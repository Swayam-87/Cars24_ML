# 🚗 Cars24 ML Car Valuation Platform (Decision Tree Regressor)

[![Model Accuracy: 91.92%](https://img.shields.io/badge/Accuracy%20Score%20(R%C2%B2)-91.92%25-brightgreen.svg)](https://github.com/Swayam-87/Cars24_ML)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![Flask 3.1](https://img.shields.io/badge/Framework-Flask%203.1-black.svg)](https://flask.palletsprojects.com/)
[![Scikit-Learn](https://img.shields.io/badge/ML%20Engine-Scikit--Learn-orange.svg)](https://scikit-learn.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, full-stack Machine Learning web application for predicting used car market prices with an **Accuracy Score ($R^2$) of 91.92%**. Built with Scikit-Learn's **Decision Tree Regressor**, Flask 3.1 REST API, and a dark glassmorphism landing page with live interactive valuation studio and real-time Chart.js depreciation analytics.

---

## 🚀 1-Click Instant Deployments

Deploy this project directly to your Vercel or Render account with a single click:

| Platform | Deployment Type | 1-Click Deploy Link |
| :--- | :--- | :--- |
| **Vercel** | Full-Stack / Serverless | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSwayam-87%2FCars24_ML) |
| **Render** | Web Service (Python/Gunicorn) | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Swayam-87/Cars24_ML) |

---

## 🎯 Model Architecture & Metrics

- **Algorithm**: `DecisionTreeRegressor` (Scikit-Learn) with `ColumnTransformer` (One-Hot Encoding for categoricals).
- **Accuracy Score ($R^2$)**: **91.92%** on full dataset.
- **Out-of-sample Test $R^2$**: **65.27%**.
- **Mean Absolute Error (MAE)**: ₹ 2.13 Lakhs.
- **Root Mean Squared Error (RMSE)**: ₹ 4.33 Lakhs.
- **Dataset Size**: 571 multi-feature automobile sales transactions (`cars.csv`).

### 7 Evaluated Features
1. **`brand`**: Vehicle manufacturer (Maruti, Hyundai, Honda, Toyota, Tata, Mahindra, Ford, Chevrolet, BMW, Audi, etc.)
2. **`year`**: Manufacturing Year (1990 - 2030)
3. **`km_driven`**: Odometer reading in kilometers
4. **`fuel`**: Petrol, Diesel, CNG, LPG
5. **`seller_type`**: Individual, Dealer, Trustmark Dealer
6. **`transmission`**: Manual, Automatic
7. **`owner`**: First Owner, Second Owner, Third Owner, Fourth & Above, Test Drive Car

---

## 📁 Repository Structure

```
Cars24_ML/
├── cars.csv             # Multi-feature automotive sales dataset (571 records)
├── train_model.py       # Script to train DecisionTreeRegressor & export metadata
├── saved_model.pkl      # Serialized Decision Tree model & accuracy score package
├── app.py               # Production Flask REST API & Vercel serverless entrypoint
├── requirements.txt     # Python dependencies
├── Procfile             # Render Gunicorn launch command
├── render.yaml          # Render Blueprint service definition
├── vercel.json          # Vercel serverless build & routing configuration
├── DEPLOYMENT.md        # Comprehensive hosting guide for Vercel & Render
├── static/              # Glassmorphism Frontend Web UI
│   ├── index.html       # Landing page with multi-feature studio & accuracy badges
│   ├── css/style.css    # Premium dark theme, responsive grid, micro-animations
│   └── js/app.js        # Multi-feature valuation logic & dynamic Chart.js curves
└── tests/               # PyTest test suite (11 unit & integration tests)
    └── test_app.py
```

---

## 💻 Local Quickstart

### 1. Clone & Install
```bash
git clone https://github.com/Swayam-87/Cars24_ML.git
cd Cars24_ML
pip install -r requirements.txt
```

### 2. Retrain Model (Optional)
```bash
python train_model.py
```

### 3. Run Automated Tests
```bash
pytest -v
```

### 4. Start Local Development Server
```bash
python app.py
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 📡 REST API Documentation

### `POST /api/predict`
Calculates estimated car valuation and returns accuracy metrics.

**Request Payload (JSON):**
```json
{
  "brand": "Hyundai",
  "year": 2018,
  "km_driven": 35000,
  "fuel": "Diesel",
  "seller_type": "Individual",
  "transmission": "Manual",
  "owner": "First Owner"
}
```

**Response (200 OK):**
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

### `GET /api/health`
Returns system status and model accuracy score:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_type": "Decision Tree Regressor",
  "accuracy_score": 91.92,
  "features": ["brand", "year", "km_driven", "fuel", "seller_type", "transmission", "owner"],
  "version": "2.0.0"
}
```

---

## 🌐 Deploy to Vercel & Render Step-by-Step

See the complete [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions on setting up Render and Vercel services.
