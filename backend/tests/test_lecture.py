import io
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


def create_mock_audio_file(filename: str = "sample_lecture.mp3", content: bytes = b"MOCK_AUDIO_DATA_FOR_TESTING") -> dict:
    """Create a multipart form file dict for TestClient."""
    return {"file": (filename, io.BytesIO(content), "audio/mpeg")}


def test_lecture_lifecycle_and_security():
    # 1. Setup users
    lecturer = register_user("lecturer", "Prof. Minerva McGonagall")
    lecturer_token = lecturer["access_token"]
    lecturer_headers = {"Authorization": f"Bearer {lecturer_token}"}

    student_1 = register_user("student", "Harry Potter")
    student1_token = student_1["access_token"]
    student1_headers = {"Authorization": f"Bearer {student1_token}"}

    student_2 = register_user("student", "Ron Weasley")
    student2_token = student_2["access_token"]
    student2_headers = {"Authorization": f"Bearer {student2_token}"}

    outsider = register_user("student", "Draco Malfoy")
    outsider_token = outsider["access_token"]
    outsider_headers = {"Authorization": f"Bearer {outsider_token}"}

    # 2. Setup classroom and subject
    class_res = client.post(
        "/api/v1/classrooms",
        json={"name": "Transfiguration 101", "description": "Art of changing properties."},
        headers=lecturer_headers,
    )
    assert class_res.status_code == 201, class_res.text
    classroom = class_res.json()
    classroom_id = classroom["id"]
    join_code = classroom["join_code"]

    # Students join classroom
    for headers in [student1_headers, student2_headers]:
        join_res = client.post(
            "/api/v1/classrooms/join",
            json={"join_code": join_code},
            headers=headers,
        )
        assert join_res.status_code in (200, 201), join_res.text

    # Lecturer creates subject
    subject_res = client.post(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        json={"name": "Intro to Inanimate Transformations", "code": "TR-101", "description": "Match to needle"},
        headers=lecturer_headers,
    )
    assert subject_res.status_code == 201, subject_res.text
    subject_id = subject_res.json()["id"]

    # 3. Student 1 uploads an audio file (starts as PENDING)
    files = create_mock_audio_file("lecture1.mp3", b"ID3\x03\x00\x00\x00\x00\x00\x10Sample audio stream")
    data = {
        "title": "Match to Needle Practical",
        "description": "Recorded live in front row with permission.",
        "duration": "145.5",
    }
    upload_res = client.post(
        f"/api/v1/subjects/{subject_id}/lectures/upload",
        headers=student1_headers,
        files=files,
        data=data,
    )
    assert upload_res.status_code == 201, upload_res.text
    lecture_1 = upload_res.json()
    assert lecture_1["title"] == "Match to Needle Practical"
    assert lecture_1["approval_status"] == "PENDING"
    assert lecture_1["is_uploader"] is True
    assert lecture_1["can_delete"] is True
    assert lecture_1["can_review"] is False
    assert "/api/v1/lectures/" in lecture_1["audio_url"]
    lecture1_id = lecture_1["id"]

    # 4. Lecturer uploads an audio file
    files_lec = create_mock_audio_file("professor_lecture.wav", b"RIFF....WAVEfmt ....data....")
    data_lec = {
        "title": "Official Professor Lecture: Animagi Theory",
        "description": "High fidelity audio lecture.",
        "duration": "2400.0",
        "status": "APPROVED",  # Lecturer can publish approved directly
    }
    upload_lec_res = client.post(
        f"/api/v1/subjects/{subject_id}/lectures/upload",
        headers=lecturer_headers,
        files=files_lec,
        data=data_lec,
    )
    assert upload_lec_res.status_code == 201, upload_lec_res.text
    lecture_lec = upload_lec_res.json()
    assert lecture_lec["title"] == "Official Professor Lecture: Animagi Theory"
    assert lecture_lec["approval_status"] == "APPROVED"
    assert lecture_lec["can_review"] is True
    lecture_lec_id = lecture_lec["id"]

    # 5. Non-member cannot upload
    files_outsider = create_mock_audio_file("spy_recording.mp3")
    outsider_upload_res = client.post(
        f"/api/v1/subjects/{subject_id}/lectures/upload",
        headers=outsider_headers,
        files=files_outsider,
        data={"title": "Unauthorized Audio"},
    )
    assert outsider_upload_res.status_code == 403, outsider_upload_res.text

    # 6. Pending recording is hidden from other students in the public library
    lib_res = client.get(
        f"/api/v1/subjects/{subject_id}/lectures",
        headers=student2_headers,
    )
    assert lib_res.status_code == 200
    student2_library = lib_res.json()
    # Student 2 should see the lecturer's APPROVED lecture, but NOT Student 1's PENDING lecture
    lib_ids = [l["id"] for l in student2_library]
    assert lecture1_id not in lib_ids
    assert lecture_lec_id in lib_ids

    # 7. Other student cannot access pending lecture details or audio
    det_res = client.get(
        f"/api/v1/lectures/{lecture1_id}",
        headers=student2_headers,
    )
    assert det_res.status_code == 403

    audio_res = client.get(
        f"/api/v1/lectures/{lecture1_id}/audio",
        headers=student2_headers,
    )
    assert audio_res.status_code == 403

    # Outsider cannot access approved audio either
    outsider_audio_res = client.get(
        f"/api/v1/lectures/{lecture_lec_id}/audio",
        headers=outsider_headers,
    )
    assert outsider_audio_res.status_code == 403

    # 8. Uploader student can view details, list in 'mine', and stream their pending audio
    uploader_det_res = client.get(
        f"/api/v1/lectures/{lecture1_id}",
        headers=student1_headers,
    )
    assert uploader_det_res.status_code == 200
    assert uploader_det_res.json()["approval_status"] == "PENDING"

    uploader_audio_res = client.get(
        f"/api/v1/lectures/{lecture1_id}/audio",
        headers=student1_headers,
    )
    assert uploader_audio_res.status_code == 200
    assert len(uploader_audio_res.content) > 0

    uploader_mine_res = client.get(
        f"/api/v1/subjects/{subject_id}/lectures?mine=true",
        headers=student1_headers,
    )
    assert uploader_mine_res.status_code == 200
    assert any(l["id"] == lecture1_id for l in uploader_mine_res.json())

    # 9. Lecturer can see pending lecture in review queue and stream it
    review_queue_res = client.get(
        f"/api/v1/subjects/{subject_id}/lectures?status=PENDING",
        headers=lecturer_headers,
    )
    assert review_queue_res.status_code == 200
    pending_ids = [l["id"] for l in review_queue_res.json()]
    assert lecture1_id in pending_ids

    lecturer_audio_res = client.get(
        f"/api/v1/lectures/{lecture1_id}/audio",
        headers=lecturer_headers,
    )
    assert lecturer_audio_res.status_code == 200

    # 10. Students cannot review or approve recordings
    student_review_res = client.patch(
        f"/api/v1/lectures/{lecture1_id}/review",
        json={"status": "APPROVED"},
        headers=student1_headers,
    )
    assert student_review_res.status_code == 403

    # 11. Lecturer approves recording
    approve_res = client.patch(
        f"/api/v1/lectures/{lecture1_id}/review",
        json={"status": "APPROVED"},
        headers=lecturer_headers,
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["approval_status"] == "APPROVED"

    # 12. Approved recording is now visible to all classroom students and streamable
    lib_res_after = client.get(
        f"/api/v1/subjects/{subject_id}/lectures",
        headers=student2_headers,
    )
    assert lib_res_after.status_code == 200
    lib_ids_after = [l["id"] for l in lib_res_after.json()]
    assert lecture1_id in lib_ids_after

    student2_audio_res = client.get(
        f"/api/v1/lectures/{lecture1_id}/audio",
        headers=student2_headers,
    )
    assert student2_audio_res.status_code == 200

    # 13. Lecturer rejects a recording with reason
    files_bad = create_mock_audio_file("bad_recording.webm", b"GIBBERISH_AUDIO_DATA")
    upload_bad_res = client.post(
        f"/api/v1/subjects/{subject_id}/lectures/upload",
        headers=student2_headers,
        files=files_bad,
        data={"title": "Noisy Recording in Cafeteria"},
    )
    assert upload_bad_res.status_code == 201
    bad_lecture_id = upload_bad_res.json()["id"]

    reject_res = client.patch(
        f"/api/v1/lectures/{bad_lecture_id}/review",
        json={"status": "REJECTED", "rejection_reason": "Too much background chatter. Please re-record."},
        headers=lecturer_headers,
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["approval_status"] == "REJECTED"
    assert reject_res.json()["rejection_reason"] == "Too much background chatter. Please re-record."

    # Rejected recording is NOT in public library for Student 1
    lib_res_check = client.get(
        f"/api/v1/subjects/{subject_id}/lectures",
        headers=student1_headers,
    )
    assert bad_lecture_id not in [l["id"] for l in lib_res_check.json()]

    # But uploader Student 2 sees rejection status and reason in 'mine'
    student2_mine = client.get(
        f"/api/v1/subjects/{subject_id}/lectures?mine=true",
        headers=student2_headers,
    )
    bad_lec_entry = next((l for l in student2_mine.json() if l["id"] == bad_lecture_id), None)
    assert bad_lec_entry is not None
    assert bad_lec_entry["approval_status"] == "REJECTED"
    assert "re-record" in bad_lec_entry["rejection_reason"]

    # 14. Invalid file formats and oversized files are rejected
    invalid_ext_res = client.post(
        f"/api/v1/subjects/{subject_id}/lectures/upload",
        headers=student1_headers,
        files={"file": ("virus.exe", io.BytesIO(b"MZ..."), "application/octet-stream")},
        data={"title": "Executable fake"},
    )
    assert invalid_ext_res.status_code == 400
    assert "Invalid file format" in invalid_ext_res.json()["detail"]

    # 15. Delete permissions
    # Random student cannot delete another's lecture
    del_forbidden = client.delete(
        f"/api/v1/lectures/{lecture1_id}",
        headers=student2_headers,
    )
    assert del_forbidden.status_code == 403

    # Uploader can delete their own rejected lecture
    del_success = client.delete(
        f"/api/v1/lectures/{bad_lecture_id}",
        headers=student2_headers,
    )
    assert del_success.status_code == 200
    assert del_success.json()["id"] == bad_lecture_id

    # Lecturer can delete any lecture in their classroom
    del_lec_success = client.delete(
        f"/api/v1/lectures/{lecture1_id}",
        headers=lecturer_headers,
    )
    assert del_lec_success.status_code == 200

    print("PASS: test_lecture_lifecycle_and_security")


if __name__ == "__main__":
    print("Running lecture tests...")
    test_lecture_lifecycle_and_security()
    print("All lecture tests passed successfully!")
