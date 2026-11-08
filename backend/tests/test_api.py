from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_login_success():
    response = client.post(
        "/auth/login",
        json={"email": "admin@test.com", "password": "admin"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_wrong_password():
    response = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "wrong"}
    )
    assert response.status_code == 401

def test_get_employees_requires_auth():
    response = client.get("/employees")
    assert response.status_code == 401