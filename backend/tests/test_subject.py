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


def test_subject_lifecycle():
    # 1. Setup users
    owner_lecturer = register_user("lecturer", "Prof. Severus Snape")
    owner_headers = {"Authorization": f"Bearer {owner_lecturer['access_token']}"}

    other_lecturer = register_user("lecturer", "Prof. Minerva McGonagall")
    other_lecturer_headers = {"Authorization": f"Bearer {other_lecturer['access_token']}"}

    student = register_user("student", "Hermione Granger")
    student_headers = {"Authorization": f"Bearer {student['access_token']}"}

    outsider = register_user("student", "Vincent Crabbe")
    outsider_headers = {"Authorization": f"Bearer {outsider['access_token']}"}

    # 2. Owner creates a classroom
    class_res = client.post(
        "/api/v1/classrooms",
        json={
            "name": "Potions Mastery",
            "description": "The subtle science and exact art of potion-making.",
        },
        headers=owner_headers,
    )
    assert class_res.status_code == 201
    classroom_id = class_res.json()["id"]
    join_code = class_res.json()["join_code"]

    # 3. Student joins the classroom
    join_res = client.post(
        "/api/v1/classrooms/join",
        json={"join_code": join_code},
        headers=student_headers,
    )
    assert join_res.status_code == 200

    # 4. Student CANNOT create a subject (403 Forbidden)
    student_create_res = client.post(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        json={"name": "Draught of Living Death", "code": "POT101", "description": "Powerful sleeping potion."},
        headers=student_headers,
    )
    assert student_create_res.status_code == 403

    # 5. Non-owner lecturer CANNOT create a subject in this classroom (403 Forbidden)
    other_create_res = client.post(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        json={"name": "Polyjuice Potion", "code": "POT102", "description": "Form transformation."},
        headers=other_lecturer_headers,
    )
    assert other_create_res.status_code == 403

    # 6. Owner lecturer creates subject 1
    create_sub1 = client.post(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        json={
            "name": "Draught of Living Death",
            "code": "POT101",
            "description": "Powerful sleeping potion that brings the drinker into a death-like slumber.",
        },
        headers=owner_headers,
    )
    assert create_sub1.status_code == 201, create_sub1.text
    sub1_data = create_sub1.json()
    assert sub1_data["name"] == "Draught of Living Death"
    assert sub1_data["code"] == "POT101"
    assert sub1_data["classroom_id"] == classroom_id
    assert sub1_data["created_by_id"] == owner_lecturer["user"]["id"]
    sub1_id = sub1_data["id"]

    # 7. Duplicate subject name in the same classroom is rejected (400 Bad Request)
    dup_sub_res = client.post(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        json={
            "name": "draught of living death",  # case-insensitive check
            "code": "POT999",
            "description": "Duplicate potion.",
        },
        headers=owner_headers,
    )
    assert dup_sub_res.status_code == 400
    assert "already exists" in dup_sub_res.json()["detail"].lower()

    # 8. Owner lecturer creates subject 2
    create_sub2 = client.post(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        json={
            "name": "Wolfsbane Potion",
            "code": "POT201",
            "description": "Relieves the symptoms of lycanthropy.",
        },
        headers=owner_headers,
    )
    assert create_sub2.status_code == 201
    sub2_id = create_sub2.json()["id"]

    # 9. Enrolled student can list classroom subjects
    student_list_res = client.get(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        headers=student_headers,
    )
    assert student_list_res.status_code == 200
    subjects_list = student_list_res.json()
    assert len(subjects_list) == 2
    names = [s["name"] for s in subjects_list]
    assert "Draught of Living Death" in names
    assert "Wolfsbane Potion" in names

    # 10. Outsider CANNOT list classroom subjects (403 Forbidden)
    outsider_list_res = client.get(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        headers=outsider_headers,
    )
    assert outsider_list_res.status_code == 403

    # 11. Enrolled student can view individual subject details
    detail_res = client.get(
        f"/api/v1/subjects/{sub1_id}",
        headers=student_headers,
    )
    assert detail_res.status_code == 200
    assert detail_res.json()["name"] == "Draught of Living Death"

    # 12. Outsider CANNOT view individual subject details (403 Forbidden)
    outsider_sub_res = client.get(
        f"/api/v1/subjects/{sub1_id}",
        headers=outsider_headers,
    )
    assert outsider_sub_res.status_code == 403

    # 13. Student CANNOT update subject (403 Forbidden)
    student_update_res = client.put(
        f"/api/v1/subjects/{sub1_id}",
        json={"name": "Hacked Name"},
        headers=student_headers,
    )
    assert student_update_res.status_code == 403

    # 14. Owner lecturer updates subject
    update_res = client.put(
        f"/api/v1/subjects/{sub1_id}",
        json={
            "name": "Advanced Draught of Living Death",
            "code": "POT101-ADV",
            "description": "Master-level brew requiring crushed Sopophorous bean.",
        },
        headers=owner_headers,
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["name"] == "Advanced Draught of Living Death"
    assert updated_data["code"] == "POT101-ADV"

    # 15. Updating subject name to another existing subject name fails (400)
    conflict_update_res = client.put(
        f"/api/v1/subjects/{sub1_id}",
        json={"name": "Wolfsbane Potion"},
        headers=owner_headers,
    )
    assert conflict_update_res.status_code == 400

    # 16. Student CANNOT delete subject (403 Forbidden)
    student_del_res = client.delete(
        f"/api/v1/subjects/{sub2_id}",
        headers=student_headers,
    )
    assert student_del_res.status_code == 403

    # 17. Non-owner lecturer CANNOT delete subject (403 Forbidden)
    other_del_res = client.delete(
        f"/api/v1/subjects/{sub2_id}",
        headers=other_lecturer_headers,
    )
    assert other_del_res.status_code == 403

    # 18. Owner lecturer deletes subject 2
    del_res = client.delete(
        f"/api/v1/subjects/{sub2_id}",
        headers=owner_headers,
    )
    assert del_res.status_code == 200

    # 19. Verify subject 2 is gone and list now contains 1 item
    list_after_del = client.get(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        headers=student_headers,
    )
    assert list_after_del.status_code == 200
    assert len(list_after_del.json()) == 1
    assert list_after_del.json()[0]["id"] == sub1_id

    # 20. GET deleted subject returns 404
    get_deleted = client.get(
        f"/api/v1/subjects/{sub2_id}",
        headers=student_headers,
    )
    assert get_deleted.status_code == 404


if __name__ == "__main__":
    print("Running subject tests...")
    test_subject_lifecycle()
    print("PASS: test_subject_lifecycle")
    print("All subject tests passed successfully!")

