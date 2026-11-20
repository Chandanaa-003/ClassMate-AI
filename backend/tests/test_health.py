from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["health"] == "/health"


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "project_name" in data
    assert "timestamp" in data


def test_api_v1_health_check_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


if __name__ == "__main__":
    print("Running backend tests...")
    test_root_endpoint()
    print("PASS: test_root_endpoint")
    test_health_check_endpoint()
    print("PASS: test_health_check_endpoint")
    test_api_v1_health_check_endpoint()
    print("PASS: test_api_v1_health_check_endpoint")
    print("All backend tests passed successfully!")

