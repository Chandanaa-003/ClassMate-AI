import uuid
from fastapi.testclient import TestClient
from app.db.session import init_db
from app.main import app

client = TestClient(app)

# Ensure database tables exist before testing
init_db()


def get_random_email() -> str:
    return f"user_{uuid.uuid4().hex[:8]}@example.com"


def test_student_registration_and_login():
    email = get_random_email()
    password = "secretpassword123"

    # 1. Register student
    reg_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Alice Student",
            "password": password,
            "role": "student",
        },
    )
    assert reg_response.status_code == 201, reg_response.text
    reg_data = reg_response.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == email
    assert reg_data["user"]["role"] == "student"
    assert "hashed_password" not in reg_data["user"]

    # 2. Duplicate registration should fail
    dup_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Alice Duplicate",
            "password": password,
            "role": "student",
        },
    )
    assert dup_response.status_code == 400

    # 3. Login with correct password
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data
    token = login_data["access_token"]

    # 4. Login with incorrect password should fail
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "wrongpassword"},
    )
    assert bad_login.status_code == 401

    # 5. Access protected /me route
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == email
    assert me_data["role"] == "student"

    # 6. Student should access student dashboard
    student_dash = client.get(
        "/api/v1/auth/student/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert student_dash.status_code == 200
    assert student_dash.json()["role"] == "student"

    # 7. Student should NOT be allowed into lecturer dashboard (403)
    forbidden_dash = client.get(
        "/api/v1/auth/lecturer/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert forbidden_dash.status_code == 403


def test_lecturer_registration_and_access_control():
    email = get_random_email()
    password = "lecturerpassword123"

    # 1. Register lecturer
    reg_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Prof. Charles Xavier",
            "password": password,
            "role": "lecturer",
        },
    )
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    token = reg_data["access_token"]
    assert reg_data["user"]["role"] == "lecturer"

    # 2. Lecturer should access lecturer dashboard
    lecturer_dash = client.get(
        "/api/v1/auth/lecturer/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert lecturer_dash.status_code == 200
    assert lecturer_dash.json()["role"] == "lecturer"

    # 3. Lecturer should NOT be allowed into student dashboard (403)
    forbidden_dash = client.get(
        "/api/v1/auth/student/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert forbidden_dash.status_code == 403


def test_unauthenticated_protected_route():
    # Attempt to access protected route without token
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


if __name__ == "__main__":
    print("Running authentication tests...")
    test_student_registration_and_login()
    print("PASS: test_student_registration_and_login")
    test_lecturer_registration_and_access_control()
    print("PASS: test_lecturer_registration_and_access_control")
    test_unauthenticated_protected_route()
    print("PASS: test_unauthenticated_protected_route")
    print("All auth tests completed successfully!")

