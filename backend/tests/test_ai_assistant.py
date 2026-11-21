import io
import time
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


def create_mock_audio_file(filename: str = "lecture.mp3", content: bytes = b"AUDIO_DATA") -> dict:
    return {"file": (filename, io.BytesIO(content), "audio/mpeg")}


def test_ai_assistant_grounding_and_conversations():
    # 1. Setup users
    lecturer = register_user("lecturer", "Dr. Alan Turing")
    lecturer_headers = {"Authorization": f"Bearer {lecturer['access_token']}"}

    student = register_user("student", "Grace Hopper")
    student_headers = {"Authorization": f"Bearer {student['access_token']}"}

    outsider = register_user("student", "Anonymous Bystander")
    outsider_headers = {"Authorization": f"Bearer {outsider['access_token']}"}

    # 2. Classroom & Subject
    class_res = client.post(
        "/api/v1/classrooms",
        json={"name": "CS401 - Advanced AI", "description": "Machine learning and algorithms"},
        headers=lecturer_headers,
    )
    assert class_res.status_code == 201
    classroom_id = class_res.json()["id"]
    join_code = class_res.json()["join_code"]

    # Student joins
    join_res = client.post(
        "/api/v1/classrooms/join",
        json={"join_code": join_code},
        headers=student_headers,
    )
    assert join_res.status_code in (200, 201)

    # Subject creation
    subj_res = client.post(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        json={
            "name": "Neural Networks & Backprop",
            "code": "NN401",
            "description": "Foundations of Deep Learning",
        },
        headers=lecturer_headers,
    )
    assert subj_res.status_code == 201
    subject_id = subj_res.json()["id"]

    # 3. Before any lectures are uploaded, asking question returns honest fallback
    pre_chat = client.post(
        f"/api/v1/subjects/{subject_id}/chat",
        json={"question": "What is backpropagation?"},
        headers=student_headers,
    )
    assert pre_chat.status_code == 200
    pre_data = pre_chat.json()
    assert "No approved lecture recordings or completed transcripts" in pre_data["answer"]
    assert pre_data["is_grounded"] is False
    assert len(pre_data["sources"]) == 0

    # 4. Upload and approve lecture
    upload_res = client.post(
        f"/api/v1/subjects/{subject_id}/lectures/upload",
        data={
            "title": "Lecture 1: Intro to Neural Networks and Gradient Descent",
            "description": "Detailed discussion of weights, loss functions, and learning rates.",
        },
        files=create_mock_audio_file("lecture1.mp3"),
        headers=lecturer_headers,
    )
    assert upload_res.status_code == 201
    lecture_id = upload_res.json()["id"]

    # Approve
    appr_res = client.patch(
        f"/api/v1/lectures/{lecture_id}/review",
        json={"status": "APPROVED"},
        headers=lecturer_headers,
    )
    assert appr_res.status_code == 200

    # Transcribe lecture
    trans_res = client.post(
        f"/api/v1/lectures/{lecture_id}/transcribe",
        json={"force_retry": True},
        headers=lecturer_headers,
    )
    assert trans_res.status_code == 202

    # Update transcript with specific educational lecture content with concepts
    custom_transcript = (
        "Welcome class. Today we discuss neural networks and backpropagation. "
        "At step zero we initialize weights. Then we compute the loss function. "
        "Gradient descent updates the weights using learning rate alpha. "
        "The chain rule is fundamental for computing gradients during backpropagation."
    )
    put_trans = client.put(
        f"/api/v1/lectures/{lecture_id}/transcript",
        json={"transcript_text": custom_transcript},
        headers=lecturer_headers,
    )
    assert put_trans.status_code == 200

    # 5. Student asks grounded question
    chat_res = client.post(
        f"/api/v1/subjects/{subject_id}/chat",
        json={"question": "How does gradient descent update weights?"},
        headers=student_headers,
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert chat_data["conversation_id"] is not None
    assert len(chat_data["answer"]) > 10
    conv_id = chat_data["conversation_id"]

    # 6. Student asks follow up in same conversation
    chat2_res = client.post(
        f"/api/v1/subjects/{subject_id}/chat",
        json={
            "question": "Why is the chain rule important?",
            "conversation_id": conv_id,
        },
        headers=student_headers,
    )
    assert chat2_res.status_code == 200
    chat2_data = chat2_res.json()
    assert chat2_data["conversation_id"] == conv_id

    # 7. List subject conversations
    list_res = client.get(
        f"/api/v1/subjects/{subject_id}/chat/conversations",
        headers=student_headers,
    )
    assert list_res.status_code == 200
    convs = list_res.json()
    assert len(convs) >= 1
    assert any(c["id"] == conv_id for c in convs)

    # 8. Get conversation detail
    detail_res = client.get(
        f"/api/v1/chat/conversations/{conv_id}",
        headers=student_headers,
    )
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["id"] == conv_id
    assert len(detail_data["messages"]) >= 4  # 2 user queries + 2 assistant answers

    # 9. Access control: Outsider cannot view student's conversation
    outsider_res = client.get(
        f"/api/v1/chat/conversations/{conv_id}",
        headers=outsider_headers,
    )
    assert outsider_res.status_code in (403, 404)

    # 10. Student deletes conversation
    del_res = client.delete(
        f"/api/v1/chat/conversations/{conv_id}",
        headers=student_headers,
    )
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # After deletion, conversation is gone
    post_del = client.get(
        f"/api/v1/chat/conversations/{conv_id}",
        headers=student_headers,
    )
    assert post_del.status_code == 404
    print("[PASS] AI Assistant Grounding and Conversations test passed successfully!")


if __name__ == "__main__":
    test_ai_assistant_grounding_and_conversations()
