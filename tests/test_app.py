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
    """Test health check endpoint"""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'
    assert data['model_loaded'] is True
    assert 'version' in data


def test_valid_prediction_2020(client):
    """Test prediction for valid year 2020"""
    payload = {'year': 2020}
    response = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['year'] == 2020
    assert 'predicted_price' in data
    assert isinstance(data['predicted_price'], (int, float))
    assert data['predicted_price'] > 0
    assert 'formatted_price_inr' in data
    assert 'valuation_range' in data
    assert data['valuation_range']['min'] < data['predicted_price'] < data['valuation_range']['max']


def test_valid_prediction_string_year(client):
    """Test prediction when year is passed as string integer '2024'"""
    payload = {'year': '2024'}
    response = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['year'] == 2024


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
    payload = {'brand': 'Honda'}
    response = client.post('/api/predict', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['success'] is False
    assert "Missing required field 'year'" in data['error']


def test_predict_range_endpoint(client):
    """Test yearly prediction range endpoint for charts"""
    response = client.get('/api/predict_range?start=2015&end=2025')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert len(data['data']) == 11
    assert data['data'][0]['year'] == 2015
    assert data['data'][-1]['year'] == 2025
