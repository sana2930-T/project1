import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "IS 10500" in data["standards"]

def test_dashboard_endpoint():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_sources" in data
    assert "screening_distribution" in data
    assert "safety_disclaimer" in data
    assert data["total_sources"] >= 5

def test_sources_endpoint():
    response = client.get("/api/sources")
    assert response.status_code == 200
    sources = response.json()
    assert len(sources) >= 5
    first_src = sources[0]
    assert "source_code" in first_src
    assert "latitude" in first_src
    assert "longitude" in first_src

def test_demo_users_endpoint():
    response = client.get("/api/auth/demo-users")
    assert response.status_code == 200
    users = response.json()
    assert len(users) == 3
    roles = [u["role"] for u in users]
    assert "Administrator" in roles
    assert "Field Officer" in roles
    assert "Community Viewer" in roles

def test_dry_run_evaluation():
    payload = {
        "source_id": 1,
        "ph": 7.4,
        "turbidity": 0.6,
        "temperature": 23.5,
        "tds": 260.0,
        "electrical_conductivity": 390.0,
        "measurement_method": "Manual"
    }
    response = client.post("/api/screenings/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Within Desirable Thresholds (Preliminary)"
    assert "safety_disclaimer" in data

def test_reports_export_measurements():
    response = client.get("/api/reports/export?type=measurements")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "pH" in response.text
