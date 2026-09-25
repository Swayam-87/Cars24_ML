import os
import sys
import json
import pytest

# Ensure parent directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app


@pytest.fixture
def client():
    """Create Flask test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_serve_frontend(client):
    """Test root endpoint serving frontend or fallback JSON"""
    response = client.get('/')
    assert response.status_code == 200


def test_health_check(client):
    """Test health check endpoint with accuracy score"""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'
    assert data['model_loaded'] is True
    assert 'accuracy_score' in data
    assert data['accuracy_score'] > 0
    assert data['model_type'] == 'Decision Tree Regressor'
    assert 'version' in data


def test_model_info_endpoint(client):
    """Test model_info endpoint returns metrics, accuracy score, and categories"""
    response = client.get('/api/model_info')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['algorithm'] == 'Decision Tree Regressor'
    assert 'accuracy_score' in data
    assert data['accuracy_score'] >= 85.0
    assert 'categories' in data
    assert 'brands' in data['categories']
    assert 'fuels' in data['categories']


def test_valid_prediction_full_features(client):
    """Test prediction with all multi-feature fields provided"""
    payload = {
        'brand': 'Hyundai',
        'year': 2018,
        'km_driven': 35000,
        'fuel': 'Diesel',
        'seller_type': 'Individual',
        'transmission': 'Manual',
        'owner': 'First Owner'
    }
    response = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['inputs']['year'] == 2018
    assert data['inputs']['brand'] == 'Hyundai'
    assert data['inputs']['transmission'] == 'Manual'
    assert 'predicted_price' in data
    assert isinstance(data['predicted_price'], (int, float))
    assert data['predicted_price'] > 0
    assert 'formatted_price_inr' in data
    assert 'model_metadata' in data
    assert 'accuracy_score' in data['model_metadata']
    assert data['valuation_range']['min'] < data['predicted_price'] < data['valuation_range']['max']


def test_valid_prediction_year_only_defaults(client):
    """Test prediction with only required year and fallback defaults for other features"""
    payload = {'year': 2015}
    response = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['inputs']['year'] == 2015
    assert data['inputs']['brand'] == 'Maruti'
    assert data['inputs']['km_driven'] == 45000


def test_valid_prediction_string_inputs(client):
    """Test prediction when numeric fields are passed as strings"""
    payload = {
        'year': '2019',
        'km_driven': '25000',
        'brand': 'Tata',
        'transmission': 'Automatic'
    }
    response = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['inputs']['year'] == 2019
    assert data['inputs']['km_driven'] == 25000


def test_invalid_year_non_numeric(client):
    """Test invalid non-numeric year input"""
    payload = {'year': 'twenty-twenty'}
    response = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['success'] is False
    assert 'Invalid year value' in data['error']


def test_out_of_range_year_low(client):
    """Test year below acceptable range (< 1990)"""
    payload = {'year': 1985}
    response = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['success'] is False
    assert 'out of realistic range' in data['error']


def test_out_of_range_year_high(client):
    """Test year above acceptable range (> 2030)"""
    payload = {'year': 2035}
    response = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['success'] is False
    assert 'out of realistic range' in data['error']


def test_missing_year_field(client):
    """Test payload missing the 'year' key"""
    payload = {'brand': 'Honda', 'km_driven': 50000}
    response = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['success'] is False
    assert "Missing required field 'year'" in data['error']


def test_predict_range_endpoint(client):
    """Test yearly prediction range endpoint with custom brand parameter"""
    response = client.get('/api/predict_range?start=2015&end=2025&brand=Hyundai&fuel=Diesel')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['brand'] == 'Hyundai'
    assert len(data['data']) == 11
    assert data['data'][0]['year'] == 2015
    assert data['data'][-1]['year'] == 2025
