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


def test_anonymous_doubt_discussion():
    # 1. Setup users
    lecturer = register_user("lecturer", "Prof. Albus Dumbledore")
    lecturer_token = lecturer["access_token"]
    lecturer_headers = {"Authorization": f"Bearer {lecturer_token}"}

    student_asker = register_user("student", "Harry Potter")
    asker_token = student_asker["access_token"]
    asker_headers = {"Authorization": f"Bearer {asker_token}"}

    student_answerer = register_user("student", "Hermione Granger")
    answerer_token = student_answerer["access_token"]
    answerer_headers = {"Authorization": f"Bearer {answerer_token}"}

    outsider = register_user("student", "Draco Malfoy")
    outsider_token = outsider["access_token"]
    outsider_headers = {"Authorization": f"Bearer {outsider_token}"}

    # 2. Lecturer creates classroom and subject
    class_res = client.post(
        "/api/v1/classrooms",
        json={"name": "Defense Against the Dark Arts", "description": "Combat curses and dark entities."},
        headers=lecturer_headers,
    )
    assert class_res.status_code == 201
    classroom_id = class_res.json()["id"]
    join_code = class_res.json()["join_code"]

    # 3. Students join classroom
    client.post("/api/v1/classrooms/join", json={"join_code": join_code}, headers=asker_headers)
    client.post("/api/v1/classrooms/join", json={"join_code": join_code}, headers=answerer_headers)

    # 4. Lecturer creates a subject
    sub_res = client.post(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        json={"name": "Patronus Charm", "code": "DADA301", "description": "Casting corporeal patronuses."},
        headers=lecturer_headers,
    )
    assert sub_res.status_code == 201
    subject_id = sub_res.json()["id"]

    # 5. Outsider CANNOT post doubt in this subject (403 Forbidden)
    outsider_post = client.post(
        f"/api/v1/subjects/{subject_id}/doubts",
        json={"title": "How to cast it?", "description": "Need help.", "is_anonymous": True},
        headers=outsider_headers,
    )
    assert outsider_post.status_code == 403

    # 6. Student asks an ANONYMOUS doubt
    doubt_res = client.post(
        f"/api/v1/subjects/{subject_id}/doubts",
        json={
            "title": "Why does my Patronus produce only silver vapor?",
            "description": "I am thinking of a very happy memory, but cannot get a corporeal shape.",
            "is_anonymous": True,
        },
        headers=asker_headers,
    )
    assert doubt_res.status_code == 201, doubt_res.text
    doubt = doubt_res.json()
    assert doubt["title"] == "Why does my Patronus produce only silver vapor?"
    assert doubt["is_anonymous"] is True
    # Privacy verification: author name must be masked, not revealing Harry Potter!
    assert doubt["author_name"] == "Anonymous Student"
    assert "Harry Potter" not in str(doubt)
    assert "author_id" not in doubt
    assert doubt["is_author"] is True  # The asker knows they are author
    doubt_id = doubt["id"]

    # 7. Another student lists doubts - author name must remain anonymous
    list_res = client.get(
        f"/api/v1/subjects/{subject_id}/doubts",
        headers=answerer_headers,
    )
    assert list_res.status_code == 200
    listed_doubts = list_res.json()
    assert len(listed_doubts) >= 1
    target = next(d for d in listed_doubts if d["id"] == doubt_id)
    assert target["author_name"] == "Anonymous Student"
    assert target["is_author"] is False
    assert "Harry Potter" not in str(target)

    # 8. Another student (Hermione) answers identified (is_anonymous=False)
    ans1_res = client.post(
        f"/api/v1/doubts/{doubt_id}/answers",
        json={
            "content": "You need an intensely powerful positive memory, not merely a happy thought.",
            "is_anonymous": False,
        },
        headers=answerer_headers,
    )
    assert ans1_res.status_code == 201
    ans1 = ans1_res.json()
    assert ans1["author_name"] == "Hermione Granger"
    assert ans1["is_accepted"] is False
    assert ans1["vote_count"] == 0
    ans1_id = ans1["id"]

    # 9. Lecturer answers anonymously (is_anonymous=True)
    ans2_res = client.post(
        f"/api/v1/doubts/{doubt_id}/answers",
        json={
            "content": "Focus completely on the emotion and let it fill your entire being before reciting Expecto Patronum.",
            "is_anonymous": True,
        },
        headers=lecturer_headers,
    )
    assert ans2_res.status_code == 201
    ans2 = ans2_res.json()
    assert ans2["author_name"] == "Anonymous Lecturer"
    assert "Dumbledore" not in str(ans2)
    ans2_id = ans2["id"]

    # 10. Upvoting: Asker upvotes Hermione's answer
    vote1_res = client.post(
        f"/api/v1/answers/{ans1_id}/vote",
        headers=asker_headers,
    )
    assert vote1_res.status_code == 200
    assert vote1_res.json()["vote_count"] == 1
    assert vote1_res.json()["has_voted"] is True

    # 11. Upvoting second time fails (Only once per user)
    dup_vote = client.post(
        f"/api/v1/answers/{ans1_id}/vote",
        headers=asker_headers,
    )
    assert dup_vote.status_code == 400
    assert "already upvoted" in dup_vote.json()["detail"].lower()

    # 12. Lecturer also upvotes Hermione's answer
    vote2_res = client.post(
        f"/api/v1/answers/{ans1_id}/vote",
        headers=lecturer_headers,
    )
    assert vote2_res.status_code == 200
    assert vote2_res.json()["vote_count"] == 2

    # 13. Accepting answer: Non-author cannot accept answer (403 Forbidden)
    bad_accept = client.post(
        f"/api/v1/answers/{ans1_id}/accept",
        headers=answerer_headers,
    )
    assert bad_accept.status_code == 403

    # 14. Question author accepts Hermione's answer
    accept_res = client.post(
        f"/api/v1/answers/{ans1_id}/accept",
        headers=asker_headers,
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["is_accepted"] is True

    # 15. Verify thread details and resolved status
    thread_res = client.get(
        f"/api/v1/doubts/{doubt_id}",
        headers=asker_headers,
    )
    assert thread_res.status_code == 200
    thread = thread_res.json()
    assert thread["status"] == "resolved"
    assert len(thread["answers"]) == 2

    # 16. Search and filter verification: filter by 'resolved' and 'unanswered'
    resolved_res = client.get(
        f"/api/v1/subjects/{subject_id}/doubts?filter_by=resolved",
        headers=asker_headers,
    )
    assert resolved_res.status_code == 200
    assert any(d["id"] == doubt_id for d in resolved_res.json())

    unanswered_res = client.get(
        f"/api/v1/subjects/{subject_id}/doubts?filter_by=unanswered",
        headers=asker_headers,
    )
    assert unanswered_res.status_code == 200
    assert not any(d["id"] == doubt_id for d in unanswered_res.json())

    # Search keyword
    search_res = client.get(
        f"/api/v1/subjects/{subject_id}/doubts?search=Patronus",
        headers=asker_headers,
    )
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1

    # 17. Moderation / Deletion:
    # Unrelated student cannot delete doubt (403)
    del_bad = client.delete(
        f"/api/v1/doubts/{doubt_id}",
        headers=answerer_headers,
    )
    assert del_bad.status_code == 403

    # Classroom lecturer CAN delete doubt (moderation)
    del_ok = client.delete(
        f"/api/v1/doubts/{doubt_id}",
        headers=lecturer_headers,
    )
    assert del_ok.status_code == 200

    # Thread is deleted
    assert client.get(f"/api/v1/doubts/{doubt_id}", headers=asker_headers).status_code == 404


if __name__ == "__main__":
    print("Running doubt discussion tests...")
    test_anonymous_doubt_discussion()
    print("PASS: test_anonymous_doubt_discussion")
    print("All doubt discussion tests passed successfully!")

