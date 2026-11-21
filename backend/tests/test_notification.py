import io
import os
import sys
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup in-memory SQLite database for test isolation
os.environ["SECRET_KEY"] = "test-secret-key-for-jwt-signing-0123456789"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.classroom import Classroom, ClassroomMembership
from app.models.subject import Subject
from app.models.user import User, UserRole
from app.models.announcement import Announcement
from app.models.notification import Notification

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_notifications_and_announcements():
    print("Running Notifications and Announcements tests...")

    # 1. Register users: Lecturer, Student 1, Student 2, Outsider
    lect_res = client.post(
        "/api/v1/auth/register",
        json={"email": "prof.notif@school.edu", "full_name": "Prof Notif", "password": "Password123!", "role": "lecturer"},
    )
    assert lect_res.status_code == 201, lect_res.text
    lect_token = lect_res.json()["access_token"]
    lect_id = lect_res.json()["user"]["id"]

    stu1_res = client.post(
        "/api/v1/auth/register",
        json={"email": "student1.notif@school.edu", "full_name": "Student One", "password": "Password123!", "role": "student"},
    )
    assert stu1_res.status_code == 201
    stu1_token = stu1_res.json()["access_token"]
    stu1_id = stu1_res.json()["user"]["id"]

    stu2_res = client.post(
        "/api/v1/auth/register",
        json={"email": "student2.notif@school.edu", "full_name": "Student Two", "password": "Password123!", "role": "student"},
    )
    assert stu2_res.status_code == 201
    stu2_token = stu2_res.json()["access_token"]
    stu2_id = stu2_res.json()["user"]["id"]

    outsider_res = client.post(
        "/api/v1/auth/register",
        json={"email": "outsider.notif@school.edu", "full_name": "Outsider", "password": "Password123!", "role": "student"},
    )
    assert outsider_res.status_code == 201
    outsider_token = outsider_res.json()["access_token"]

    # 2. Lecturer creates Classroom & Subject
    cr_res = client.post(
        "/api/v1/classrooms",
        headers={"Authorization": f"Bearer {lect_token}"},
        json={"name": "Distributed Systems", "description": "Cloud & Consensus"},
    )
    assert cr_res.status_code == 201
    cr_id = cr_res.json()["id"]
    join_code = cr_res.json()["join_code"]

    subj_res = client.post(
        f"/api/v1/classrooms/{cr_id}/subjects",
        headers={"Authorization": f"Bearer {lect_token}"},
        json={"name": "Paxos & Raft", "code": "CS-401", "description": "Consensus Protocols"},
    )
    assert subj_res.status_code == 201
    subj_id = subj_res.json()["id"]

    # 3. Students join classroom
    j1 = client.post("/api/v1/classrooms/join", headers={"Authorization": f"Bearer {stu1_token}"}, json={"join_code": join_code})
    assert j1.status_code == 200
    j2 = client.post("/api/v1/classrooms/join", headers={"Authorization": f"Bearer {stu2_token}"}, json={"join_code": join_code})
    assert j2.status_code == 200

    # 4. Student tries to publish announcement -> 403 Forbidden
    stu_ann_res = client.post(
        f"/api/v1/classrooms/{cr_id}/announcements",
        headers={"Authorization": f"Bearer {stu1_token}"},
        json={"title": "Unauthorized Post", "content": "Should fail", "priority": "Normal"},
    )
    assert stu_ann_res.status_code == 403, "Students must not publish announcements"

    # 5. Lecturer publishes classroom announcement
    ann_res = client.post(
        f"/api/v1/classrooms/{cr_id}/announcements",
        headers={"Authorization": f"Bearer {lect_token}"},
        json={
            "title": "Midterm Exam Announced",
            "content": "Midterm will take place next Monday at 10:00 AM.",
            "priority": "Important",
        },
    )
    assert ann_res.status_code == 201
    ann_id = ann_res.json()["id"]
    assert ann_res.json()["priority"] == "Important"
    assert ann_res.json()["is_author"] is True

    # 6. Verify Students received announcement notification (and lecturer did NOT notify self)
    n1_res = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {stu1_token}"})
    assert n1_res.status_code == 200
    n1_data = n1_res.json()
    assert n1_data["total"] >= 1
    assert any("Midterm Exam Announced" in item["message"] for item in n1_data["items"])
    assert n1_data["unread_count"] >= 1

    n2_res = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {stu2_token}"})
    assert n2_res.status_code == 200
    assert n2_res.json()["total"] >= 1

    lect_n_res = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {lect_token}"})
    assert lect_n_res.status_code == 200
    assert not any("Midterm Exam Announced" in item["message"] for item in lect_n_res.json()["items"]), "Author should not notify self"

    # 7. Lecturer publishes subject announcement
    subj_ann_res = client.post(
        f"/api/v1/classrooms/{cr_id}/announcements",
        headers={"Authorization": f"Bearer {lect_token}"},
        json={
            "title": "Lab 3 Deadline Extended",
            "content": "You have 48 additional hours for Paxos lab submission.",
            "subject_id": subj_id,
            "priority": "Urgent",
        },
    )
    assert subj_ann_res.status_code == 201
    subj_ann_id = subj_ann_res.json()["id"]

    # 8. Filter announcements by subject
    list_ann = client.get(
        f"/api/v1/classrooms/{cr_id}/announcements?subject_id={subj_id}",
        headers={"Authorization": f"Bearer {stu1_token}"},
    )
    assert list_ann.status_code == 200
    assert len(list_ann.json()) >= 2  # general + subject

    # 9. Outsider cannot view classroom announcements
    out_ann = client.get(
        f"/api/v1/classrooms/{cr_id}/announcements",
        headers={"Authorization": f"Bearer {outsider_token}"},
    )
    assert out_ann.status_code == 403

    # 10. Edit announcement
    edit_ann = client.put(
        f"/api/v1/announcements/{ann_id}",
        headers={"Authorization": f"Bearer {lect_token}"},
        json={"title": "Midterm Exam Rescheduled", "priority": "Urgent"},
    )
    assert edit_ann.status_code == 200
    assert edit_ann.json()["title"] == "Midterm Exam Rescheduled"
    assert edit_ann.json()["priority"] == "Urgent"

    # 11. Student creates Doubt -> Lecturer receives notification
    doubt_res = client.post(
        f"/api/v1/subjects/{subj_id}/doubts",
        headers={"Authorization": f"Bearer {stu1_token}"},
        json={"title": "How does 2-phase commit differ from Raft?", "description": "Need clarification", "is_anonymous": True},
    )
    assert doubt_res.status_code == 201
    doubt_id = doubt_res.json()["id"]

    lect_n_after_doubt = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {lect_token}"})
    assert any(item["notification_type"] == "doubt_created" and item["resource_id"] == doubt_id for item in lect_n_after_doubt.json()["items"])

    # 12. Student 2 answers Doubt -> Student 1 (doubt author) receives notification
    ans_res = client.post(
        f"/api/v1/doubts/{doubt_id}/answers",
        headers={"Authorization": f"Bearer {stu2_token}"},
        json={"content": "2PC is blocking on coordinator failure while Raft achieves quorum consensus.", "is_anonymous": False},
    )
    assert ans_res.status_code == 201
    ans_id = ans_res.json()["id"]

    stu1_n_after_ans = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {stu1_token}"})
    assert any(item["notification_type"] == "doubt_answered" and item["resource_id"] == doubt_id for item in stu1_n_after_ans.json()["items"])

    # 13. Student 1 accepts Student 2's answer -> Student 2 receives notification
    acc_res = client.post(f"/api/v1/answers/{ans_id}/accept", headers={"Authorization": f"Bearer {stu1_token}"})
    assert acc_res.status_code == 200

    stu2_n_after_acc = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {stu2_token}"})
    assert any(item["notification_type"] == "answer_accepted" and item["resource_id"] == doubt_id for item in stu2_n_after_acc.json()["items"])

    # 14. Student uploads lecture audio -> Lecturer receives notification
    fake_audio = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00D\xac\x00\x00\x01\x00\x08\x00data\x00\x00\x00\x00")
    fake_audio.name = "audio.wav"
    upload_res = client.post(
        f"/api/v1/subjects/{subj_id}/lectures/upload",
        headers={"Authorization": f"Bearer {stu1_token}"},
        data={"title": "Student Audio Recording", "description": "Lecture 1"},
        files={"file": ("audio.wav", fake_audio, "audio/wav")},
    )
    assert upload_res.status_code == 201
    lec_id = upload_res.json()["id"]

    lect_n_after_upload = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {lect_token}"})
    assert any(item["notification_type"] == "lecture_uploaded" and item["resource_id"] == lec_id for item in lect_n_after_upload.json()["items"])

    # 15. Lecturer approves lecture -> Student receives notification
    rev_res = client.patch(
        f"/api/v1/lectures/{lec_id}/review",
        headers={"Authorization": f"Bearer {lect_token}"},
        json={"status": "APPROVED"},
    )
    assert rev_res.status_code == 200

    stu1_n_after_app = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {stu1_token}"})
    assert any(item["notification_type"] == "lecture_approved" and item["resource_id"] == lec_id for item in stu1_n_after_app.json()["items"])

    # 16. Student submits feedback -> Lecturer receives feedback notification (anonymized)
    fb_res = client.post(
        f"/api/v1/subjects/{subj_id}/feedback",
        headers={"Authorization": f"Bearer {stu1_token}"},
        json={
            "overall_rating": 5,
            "teaching_clarity_rating": 5,
            "lecture_pace_rating": 4,
            "concept_understanding_rating": 5,
            "positive_feedback": "Clear explanations of consensus",
            "feedback_period": "midterm",
        },
    )
    assert fb_res.status_code == 201

    lect_n_after_fb = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {lect_token}"})
    assert any(item["notification_type"] == "feedback_submitted" for item in lect_n_after_fb.json()["items"])

    # 17. Unread count endpoint
    unread_res = client.get("/api/v1/notifications/unread-count", headers={"Authorization": f"Bearer {stu1_token}"})
    assert unread_res.status_code == 200
    unread_count = unread_res.json()["unread_count"]
    assert unread_count >= 1

    # 18. Mark single notification as read
    notif_id_to_read = stu1_n_after_app.json()["items"][0]["id"]
    mark_res = client.patch(f"/api/v1/notifications/{notif_id_to_read}/read", headers={"Authorization": f"Bearer {stu1_token}"})
    assert mark_res.status_code == 200
    assert mark_res.json()["is_read"] is True

    # 19. Unauthorized mark read / delete (Outsider tries to mark Student 1's notification)
    bad_read = client.patch(f"/api/v1/notifications/{notif_id_to_read}/read", headers={"Authorization": f"Bearer {outsider_token}"})
    assert bad_read.status_code in (403, 404), "Cannot modify another user's notification"

    bad_del = client.delete(f"/api/v1/notifications/{notif_id_to_read}", headers={"Authorization": f"Bearer {outsider_token}"})
    assert bad_del.status_code in (403, 404), "Cannot delete another user's notification"

    # 20. Mark all as read
    mark_all = client.patch("/api/v1/notifications/read-all", headers={"Authorization": f"Bearer {stu1_token}"})
    assert mark_all.status_code == 200
    assert mark_all.json()["unread_count"] == 0

    unread_after_all = client.get("/api/v1/notifications/unread-count", headers={"Authorization": f"Bearer {stu1_token}"})
    assert unread_after_all.json()["unread_count"] == 0

    # 21. Delete notification
    del_res = client.delete(f"/api/v1/notifications/{notif_id_to_read}", headers={"Authorization": f"Bearer {stu1_token}"})
    assert del_res.status_code == 200

    # 22. Delete announcement
    del_ann = client.delete(f"/api/v1/announcements/{ann_id}", headers={"Authorization": f"Bearer {lect_token}"})
    assert del_ann.status_code == 200

    print("PASS: test_notifications_and_announcements")


if __name__ == "__main__":
    test_notifications_and_announcements()
    print("All notification and announcement tests passed successfully!")
