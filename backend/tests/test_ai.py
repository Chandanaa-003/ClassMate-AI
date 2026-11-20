import io
import time
import uuid
from fastapi.testclient import TestClient
from app.db.session import init_db
from app.main import app
from app.models.transcript import ProcessingStatus

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


def create_mock_audio_file(filename: str = "lecture.mp3", content: bytes = b"AUDIO_DATA") -> dict:
    return {"file": (filename, io.BytesIO(content), "audio/mpeg")}


def test_ai_transcription_and_smart_notes():
    # 1. User Setup
    lecturer = register_user("lecturer", "Prof. Charles Babbage")
    lecturer_token = lecturer["access_token"]
    lecturer_headers = {"Authorization": f"Bearer {lecturer_token}"}

    student = register_user("student", "Ada Lovelace")
    student_token = student["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    outsider = register_user("student", "Thomas Edison")
    outsider_token = outsider["access_token"]
    outsider_headers = {"Authorization": f"Bearer {outsider_token}"}

    # 2. Classroom & Subject Setup
    class_res = client.post(
        "/api/v1/classrooms",
        json={"name": "Computer Science 202", "description": "Algorithms and Data Structures."},
        headers=lecturer_headers,
    )
    assert class_res.status_code == 201
    classroom_id = class_res.json()["id"]
    join_code = class_res.json()["join_code"]

    # Student joins classroom
    join_res = client.post(
        "/api/v1/classrooms/join",
        json={"join_code": join_code},
        headers=student_headers,
    )
    assert join_res.status_code in (200, 201)

    # Subject setup
    subj_res = client.post(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        json={"name": "Linear Data Structures", "code": "CS-202"},
        headers=lecturer_headers,
    )
    assert subj_res.status_code == 201
    subject_id = subj_res.json()["id"]

    # 3. Create Approved English Lecture
    files_en = create_mock_audio_file("english_lecture.mp3")
    data_en = {
        "title": "Stack and Queue Principles",
        "description": "Comprehensive review of LIFO and FIFO implementations.",
        "status": "APPROVED",
    }
    lec1_res = client.post(
        f"/api/v1/subjects/{subject_id}/lectures/upload",
        headers=lecturer_headers,
        files=files_en,
        data=data_en,
    )
    assert lec1_res.status_code == 201
    lec1_id = lec1_res.json()["id"]

    # 4. Create Approved Kannada / Mixed Lecture
    files_kn = create_mock_audio_file("kannada_mixed_lecture.mp3")
    data_kn = {
        "title": "Stack mathu Queue Parikalpane (Mixed Lecture)",
        "description": "Kannada and English mixed classroom lecture.",
        "status": "APPROVED",
    }
    lec2_res = client.post(
        f"/api/v1/subjects/{subject_id}/lectures/upload",
        headers=lecturer_headers,
        files=files_kn,
        data=data_kn,
    )
    assert lec2_res.status_code == 201
    lec2_id = lec2_res.json()["id"]

    # 5. Check Initial Transcript Status (NOT_STARTED)
    init_transcript_res = client.get(
        f"/api/v1/lectures/{lec1_id}/transcript",
        headers=student_headers,
    )
    assert init_transcript_res.status_code == 200
    assert init_transcript_res.json()["status"] == ProcessingStatus.NOT_STARTED.value

    # 6. Trigger Transcription for English Lecture
    transcribe_res = client.post(
        f"/api/v1/lectures/{lec1_id}/transcribe",
        headers=student_headers,
    )
    assert transcribe_res.status_code == 202

    # Poll / verify completion
    transcript_res = client.get(
        f"/api/v1/lectures/{lec1_id}/transcript",
        headers=student_headers,
    )
    assert transcript_res.status_code == 200
    t_data = transcript_res.json()
    assert t_data["status"] == ProcessingStatus.COMPLETED.value
    assert len(t_data["transcript_text"]) > 20
    assert len(t_data["segments"]) > 0
    # Verify segment timestamps
    first_seg = t_data["segments"][0]
    assert "start" in first_seg and "end" in first_seg and "text" in first_seg
    assert first_seg["end"] >= first_seg["start"]

    # 7. Prevent Duplicate Transcription without Force Retry
    dup_res = client.post(
        f"/api/v1/lectures/{lec1_id}/transcribe",
        json={"force_retry": False},
        headers=student_headers,
    )
    # Should return existing completed transcript immediately
    assert dup_res.status_code == 202
    assert dup_res.json()["status"] == ProcessingStatus.COMPLETED.value

    # 8. Transcribe Kannada / Mixed Lecture
    transcribe_kn_res = client.post(
        f"/api/v1/lectures/{lec2_id}/transcribe",
        json={"language": "kn-en (mixed)"},
        headers=student_headers,
    )
    assert transcribe_kn_res.status_code == 202

    kn_transcript_res = client.get(
        f"/api/v1/lectures/{lec2_id}/transcript",
        headers=student_headers,
    )
    assert kn_transcript_res.status_code == 200
    kn_data = kn_transcript_res.json()
    assert kn_data["status"] == ProcessingStatus.COMPLETED.value
    assert "mixed" in kn_data["language"] or "kannada" in kn_data["language"]
    assert len(kn_data["segments"]) > 0

    # 9. Edit and Save Transcript
    updated_text = t_data["transcript_text"] + " [Clarification added by lecturer: O(1) space applies to each node]."
    edit_res = client.put(
        f"/api/v1/lectures/{lec1_id}/transcript",
        json={"transcript_text": updated_text},
        headers=lecturer_headers,
    )
    assert edit_res.status_code == 200
    assert "Clarification added" in edit_res.json()["transcript_text"]

    # Non-member or unauthorized student cannot edit
    unauth_edit = client.put(
        f"/api/v1/lectures/{lec1_id}/transcript",
        json={"transcript_text": "Hacked text"},
        headers=outsider_headers,
    )
    assert unauth_edit.status_code == 403

    # 10. Generate AI Smart Notes from Completed Transcript
    notes_post_res = client.post(
        f"/api/v1/lectures/{lec1_id}/generate-notes",
        headers=student_headers,
    )
    assert notes_post_res.status_code == 202

    # Verify Smart Notes Result
    notes_get_res = client.get(
        f"/api/v1/lectures/{lec1_id}/notes",
        headers=student_headers,
    )
    assert notes_get_res.status_code == 200
    notes_data = notes_get_res.json()
    assert notes_data["status"] == ProcessingStatus.COMPLETED.value
    assert notes_data["overview"] is not None
    assert len(notes_data["content_markdown"]) > 50

    # Check that all 9 required sections are present
    sections = notes_data["sections"]
    required_keys = [
        "overview",
        "important_concepts",
        "topic_explanations",
        "key_definitions",
        "important_points",
        "examples_mentioned",
        "important_keywords",
        "quick_revision_summary",
        "possible_exam_questions",
    ]
    for key in required_keys:
        assert key in sections, f"Missing section '{key}' in generated notes"

    # Confirm notes are grounded in the transcript
    assert "Stack" in notes_data["content_markdown"] or "Queue" in notes_data["content_markdown"]

    # 11. Cannot Generate Notes for Lecture Without Completed Transcript
    lec3_res = client.post(
        f"/api/v1/subjects/{subject_id}/lectures/upload",
        headers=lecturer_headers,
        files=create_mock_audio_file("untranscribed.mp3"),
        data={"title": "Empty Lecture Without Transcript", "status": "APPROVED"},
    )
    assert lec3_res.status_code == 201
    lec3_id = lec3_res.json()["id"]

    premature_notes = client.post(
        f"/api/v1/lectures/{lec3_id}/generate-notes",
        headers=student_headers,
    )
    assert premature_notes.status_code == 400
    assert "Transcript must be completed" in premature_notes.json()["detail"]

    # 12. Security: Outsider cannot access transcripts or notes
    outsider_t_res = client.get(
        f"/api/v1/lectures/{lec1_id}/transcript",
        headers=outsider_headers,
    )
    assert outsider_t_res.status_code == 403

    outsider_n_res = client.get(
        f"/api/v1/lectures/{lec1_id}/notes",
        headers=outsider_headers,
    )
    assert outsider_n_res.status_code == 403

    # 13. Retry Transcription with force_retry
    retry_res = client.post(
        f"/api/v1/lectures/{lec1_id}/transcribe",
        json={"force_retry": True},
        headers=student_headers,
    )
    assert retry_res.status_code == 202

    print("PASS: test_ai_transcription_and_smart_notes")


if __name__ == "__main__":
    print("Running AI transcription & Smart Notes tests...")
    test_ai_transcription_and_smart_notes()
    print("All AI tests passed successfully!")

