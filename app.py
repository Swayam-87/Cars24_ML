import os
import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
# Initialize Flask app serving static frontend files from 'static' folder
app = Flask(__name__, static_folder='static', static_url_path='')

try:
    from flask_cors import CORS
    CORS(app)
except ImportError:
    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
        return response


# Locate and load trained Machine Learning model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'saved_model.pkl')

model = None
model_load_error = None

try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"[INFO] ML Model loaded successfully from {MODEL_PATH}")
    else:
        model_load_error = f"Model file not found at {MODEL_PATH}"
        print(f"[ERROR] {model_load_error}")
except Exception as e:
    model_load_error = str(e)
    print(f"[ERROR] Failed to load model: {e}")


def format_inr(amount):
    """Format numeric amount into Indian Rupee (INR) currency format (e.g. ₹ 9,05,999)"""
    amount = max(0, round(amount))
    s = str(amount)
    if len(s) <= 3:
        return f"₹ {s}"
    last_three = s[-3:]
    other_digits = s[:-3]
    res = ""
    for i in range(len(other_digits)):
        if (len(other_digits) - i) % 2 == 0:
            res += "," + other_digits[i]
        else:
            res += other_digits[i]
    if res.startswith(","):
        res = res[1:]
    return f"₹ {res},{last_three}"


def format_lakhs(amount):
    """Format numeric amount in Lakhs / Crores for clear display"""
    amount = max(0, amount)
    if amount >= 10000000:
        return f"₹ {amount / 10000000:.2f} Cr"
    elif amount >= 100000:
        return f"₹ {amount / 100000:.2f} Lakhs"
    else:
        return f"₹ {amount:,.0f}"


@app.route('/')
def serve_frontend():
    """Serve main static frontend landing page"""
    if os.path.exists(os.path.join(BASE_DIR, 'static', 'index.html')):
        return send_from_directory('static', 'index.html')
    return jsonify({
        "message": "Cars24 ML Valuation API Server",
        "status": "online",
        "health_check": "/api/health",
        "predict_endpoint": "/api/predict"
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """API health status and diagnostic information"""
    return jsonify({
        "status": "healthy" if model is not None else "degraded",
        "model_loaded": model is not None,
        "error": model_load_error,
        "model_type": str(type(model).__name__) if model is not None else None,
        "features": list(getattr(model, "feature_names_in_", ["year"])) if model is not None else ["year"],
        "version": "1.0.0"
    }), 200 if model is not None else 500


@app.route('/api/predict', methods=['POST'])
def predict():
    """
    ML Prediction Endpoint
    Accepts JSON body: { "year": 2020 }
    """
    if model is None:
        return jsonify({
            "success": False,
            "error": "Machine Learning model is not loaded.",
            "details": model_load_error
        }), 500

    data = request.get_json(silent=True) or request.form
    if not data or 'year' not in data:
        return jsonify({
            "success": False,
            "error": "Missing required field 'year'. Payload must contain { 'year': <integer> }."
        }), 400

    raw_year = data.get('year')

    # Validate numeric type
    try:
        year = int(float(raw_year))
    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "error": f"Invalid year value '{raw_year}'. Must be a valid integer year."
        }), 400

    # Range validation
    if year < 1990 or year > 2030:
        return jsonify({
            "success": False,
            "error": f"Year {year} is out of realistic range. Please enter a manufacturing year between 1990 and 2030."
        }), 400

    try:
        # Create input DataFrame with expected feature name to avoid warnings
        input_df = pd.DataFrame([[year]], columns=['year'])
        raw_prediction = float(model.predict(input_df)[0])
        predicted_price = max(10000.0, raw_prediction)  # Ensure baseline non-negative valuation

        # Calculate estimated price range (±4% market variation band)
        min_range = max(10000.0, predicted_price * 0.96)
        max_range = predicted_price * 1.04

        return jsonify({
            "success": True,
            "year": year,
            "predicted_price": round(predicted_price, 2),
            "formatted_price_inr": format_inr(predicted_price),
            "formatted_lakhs": format_lakhs(predicted_price),
            "valuation_range": {
                "min": round(min_range, 2),
                "max": round(max_range, 2),
                "formatted_min": format_lakhs(min_range),
                "formatted_max": format_lakhs(max_range)
            },
            "model_metadata": {
                "algorithm": "Linear Regression",
                "framework": "Scikit-Learn",
                "features_used": ["year"]
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": "An error occurred while computing valuation.",
            "details": str(e)
        }), 500


@app.route('/api/predict_range', methods=['GET'])
def predict_range():
    """
    Returns yearly price valuation projections for dynamic visual charts.
    Query params: start (default 2010), end (default 2026)
    """
    if model is None:
        return jsonify({"success": False, "error": "Model not loaded"}), 500

    start = request.args.get('start', default=2010, type=int)
    end = request.args.get('end', default=2026, type=int)

    start = max(1990, min(start, 2030))
    end = max(start + 1, min(end, 2030))

    years = list(range(start, end + 1))
    predictions = []

    for y in years:
        input_df = pd.DataFrame([[y]], columns=['year'])
        pred = max(10000.0, float(model.predict(input_df)[0]))
        predictions.append({
            "year": y,
            "price": round(pred, 2),
            "formatted_lakhs": format_lakhs(pred),
            "formatted_inr": format_inr(pred)
        })

    return jsonify({
        "success": True,
        "data": predictions
    }), 200


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found", "status": 404}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error", "status": 500}), 500


# Export handler for Vercel serverless functions
handler = app

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"[INFO] Starting Cars24 ML Valuation Web Application on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
