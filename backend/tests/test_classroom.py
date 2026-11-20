import uuid
from fastapi.testclient import TestClient
from app.db.session import init_db
from app.main import app

client = TestClient(app)

# Ensure database tables exist
init_db()


def register_user(role: str, name: str) -> dict:
    email = f"{role}_{uuid.uuid4().hex[:8]}@test.edu"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": name,
            "password": "password123",
            "role": role,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_classroom_lifecycle():
    # 1. Setup users
    lecturer = register_user("lecturer", "Prof. Dumbledore")
    lecturer_token = lecturer["access_token"]
    lecturer_headers = {"Authorization": f"Bearer {lecturer_token}"}

    student_1 = register_user("student", "Harry Potter")
    student_1_token = student_1["access_token"]
    student_1_headers = {"Authorization": f"Bearer {student_1_token}"}

    student_2 = register_user("student", "Ron Weasley")
    student_2_token = student_2["access_token"]
    student_2_headers = {"Authorization": f"Bearer {student_2_token}"}

    outsider = register_user("student", "Draco Malfoy")
    outsider_token = outsider["access_token"]
    outsider_headers = {"Authorization": f"Bearer {outsider_token}"}

    # 2. Student cannot create a classroom (403 Forbidden)
    student_create_res = client.post(
        "/api/v1/classrooms",
        json={"name": "Defense Against the Dark Arts", "description": "Illegal for student"},
        headers=student_1_headers,
    )
    assert student_create_res.status_code == 403

    # 3. Lecturer creates classroom successfully
    create_res = client.post(
        "/api/v1/classrooms",
        json={
            "name": "Advanced Transfiguration",
            "description": "Learn the theory and practice of advanced shapeshifting.",
        },
        headers=lecturer_headers,
    )
    assert create_res.status_code == 201, create_res.text
    classroom = create_res.json()
    assert classroom["name"] == "Advanced Transfiguration"
    assert "join_code" in classroom
    assert classroom["join_code"].startswith("CM-")
    assert classroom["member_count"] == 0
    assert classroom["is_lecturer"] is True
    classroom_id = classroom["id"]
    join_code = classroom["join_code"]

    # 4. Lecturer cannot join their own classroom as a student
    lecturer_join_res = client.post(
        "/api/v1/classrooms/join",
        json={"join_code": join_code},
        headers=lecturer_headers,
    )
    assert lecturer_join_res.status_code == 400

    # 5. Invalid join code fails (404 Not Found)
    bad_code_res = client.post(
        "/api/v1/classrooms/join",
        json={"join_code": "INVALID99"},
        headers=student_1_headers,
    )
    assert bad_code_res.status_code == 404

    # 6. Student 1 joins classroom
    join_res_1 = client.post(
        "/api/v1/classrooms/join",
        json={"join_code": join_code.lower()},  # case-insensitive check
        headers=student_1_headers,
    )
    assert join_res_1.status_code == 200
    assert join_res_1.json()["name"] == "Advanced Transfiguration"
    assert join_res_1.json()["member_count"] == 1

    # 7. Student 1 cannot join the same classroom twice (400 Bad Request)
    dup_join = client.post(
        "/api/v1/classrooms/join",
        json={"join_code": join_code},
        headers=student_1_headers,
    )
    assert dup_join.status_code == 400
    assert "already joined" in dup_join.json()["detail"].lower()

    # 8. Student 2 joins classroom
    join_res_2 = client.post(
        "/api/v1/classrooms/join",
        json={"join_code": join_code},
        headers=student_2_headers,
    )
    assert join_res_2.status_code == 200
    assert join_res_2.json()["member_count"] == 2

    # 9. Lecturer dashboard query (GET /api/v1/classrooms)
    lecturer_classes = client.get("/api/v1/classrooms", headers=lecturer_headers)
    assert lecturer_classes.status_code == 200
    classes_list = lecturer_classes.json()
    assert len(classes_list) >= 1
    found = next((c for c in classes_list if c["id"] == classroom_id), None)
    assert found is not None
    assert found["member_count"] == 2

    # 10. Student 1 query (GET /api/v1/classrooms) shows joined classroom
    student_classes = client.get("/api/v1/classrooms", headers=student_1_headers)
    assert student_classes.status_code == 200
    assert any(c["id"] == classroom_id for c in student_classes.json())

    # 11. Outsider cannot access classroom details (403 Forbidden)
    outsider_detail = client.get(
        f"/api/v1/classrooms/{classroom_id}",
        headers=outsider_headers,
    )
    assert outsider_detail.status_code == 403

    # 12. Lecturer and Student 1 CAN access classroom details
    detail_res = client.get(
        f"/api/v1/classrooms/{classroom_id}",
        headers=student_1_headers,
    )
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert len(detail_data["members"]) == 2

    # 13. Get members roster
    members_res = client.get(
        f"/api/v1/classrooms/{classroom_id}/members",
        headers=lecturer_headers,
    )
    assert members_res.status_code == 200
    members = members_res.json()
    assert len(members) == 2
    student_names = [m["full_name"] for m in members]
    assert "Harry Potter" in student_names
    assert "Ron Weasley" in student_names

    # 14. Outsider cannot view members list (403 Forbidden)
    outsider_members = client.get(
        f"/api/v1/classrooms/{classroom_id}/members",
        headers=outsider_headers,
    )
    assert outsider_members.status_code == 403

    # 15. Lecturer cannot leave their own classroom (400)
    lecturer_leave = client.delete(
        f"/api/v1/classrooms/{classroom_id}/leave",
        headers=lecturer_headers,
    )
    assert lecturer_leave.status_code == 400

    # 16. Student 2 leaves classroom successfully
    leave_res = client.delete(
        f"/api/v1/classrooms/{classroom_id}/leave",
        headers=student_2_headers,
    )
    assert leave_res.status_code == 200

    # 17. Verify member count reduced to 1
    updated_detail = client.get(
        f"/api/v1/classrooms/{classroom_id}",
        headers=student_1_headers,
    )
    assert updated_detail.status_code == 200
    assert updated_detail.json()["member_count"] == 1

    # 18. Student 2 is now an outsider and cannot access classroom details (403)
    former_member_detail = client.get(
        f"/api/v1/classrooms/{classroom_id}",
        headers=student_2_headers,
    )
    assert former_member_detail.status_code == 403


if __name__ == "__main__":
    print("Running classroom tests...")
    test_classroom_lifecycle()
    print("PASS: test_classroom_lifecycle")
    print("All classroom tests passed successfully!")

