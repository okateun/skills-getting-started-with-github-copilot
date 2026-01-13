from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Tennis Club" in data


def test_signup_and_unregister_flow():
    activity = "Tennis Club"
    email = "pytest-test-user@example.com"

    # Ensure email is not already registered
    resp = client.get("/activities")
    assert resp.status_code == 200
    assert email not in resp.json()[activity]["participants"]

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Confirm participant is present
    resp = client.get("/activities")
    assert email in resp.json()[activity]["participants"]

    # Duplicate signup should fail
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 400

    # Unregister
    resp = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")

    # Confirm removal
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]

    # Unregistering again should fail
    resp = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 400
