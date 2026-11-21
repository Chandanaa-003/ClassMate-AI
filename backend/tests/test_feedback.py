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


def test_anonymous_feedback_and_analytics():
    # 1. Setup users
    lecturer = register_user("lecturer", "Prof. Richard Feynman")
    lecturer_token = lecturer["access_token"]
    lecturer_headers = {"Authorization": f"Bearer {lecturer_token}"}

    other_lecturer = register_user("lecturer", "Prof. Walter Lewin")
    other_lecturer_token = other_lecturer["access_token"]
    other_lecturer_headers = {"Authorization": f"Bearer {other_lecturer_token}"}

    student_1 = register_user("student", "Albert Einstein")
    student1_token = student_1["access_token"]
    student1_headers = {"Authorization": f"Bearer {student1_token}"}

    student_2 = register_user("student", "Niels Bohr")
    student2_token = student_2["access_token"]
    student2_headers = {"Authorization": f"Bearer {student2_token}"}

    student_3 = register_user("student", "Marie Curie")
    student3_token = student_3["access_token"]
    student3_headers = {"Authorization": f"Bearer {student3_token}"}

    outsider = register_user("student", "Isaac Newton")
    outsider_token = outsider["access_token"]
    outsider_headers = {"Authorization": f"Bearer {outsider_token}"}

    # 2. Lecturer creates classroom and subjects
    class_res = client.post(
        "/api/v1/classrooms",
        json={"name": "Quantum Mechanics 101", "description": "Fundamentals of wave mechanics."},
        headers=lecturer_headers,
    )
    assert class_res.status_code == 201
    classroom_id = class_res.json()["id"]
    join_code = class_res.json()["join_code"]

    # Students join classroom
    for headers in [student1_headers, student2_headers, student3_headers]:
        join_res = client.post(
            "/api/v1/classrooms/join",
            json={"join_code": join_code},
            headers=headers,
        )
        assert join_res.status_code in (200, 201)

    # Create Subject 1
    subj1_res = client.post(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        json={"name": "Wave-Particle Duality", "code": "QM-101"},
        headers=lecturer_headers,
    )
    assert subj1_res.status_code == 201
    subj1_id = subj1_res.json()["id"]

    # Create Subject 2
    subj2_res = client.post(
        f"/api/v1/classrooms/{classroom_id}/subjects",
        json={"name": "Schrodinger Equation", "code": "QM-102"},
        headers=lecturer_headers,
    )
    assert subj2_res.status_code == 201
    subj2_id = subj2_res.json()["id"]

    # 3. Test Student 1 submits anonymous feedback
    fb1_payload = {
        "overall_rating": 5,
        "teaching_clarity_rating": 5,
        "lecture_pace_rating": 4,
        "concept_understanding_rating": 5,
        "positive_feedback": "The intuitive physical explanations are brilliant and very engaging.",
        "improvement_suggestions": "Please upload handwritten problem sheet solutions earlier.",
        "additional_comments": "Loved the live demos.",
        "feedback_period": "general",
    }
    fb1_res = client.post(
        f"/api/v1/subjects/{subj1_id}/feedback",
        json=fb1_payload,
        headers=student1_headers,
    )
    assert fb1_res.status_code == 201, fb1_res.text
    fb1_data = fb1_res.json()
    assert fb1_data["overall_rating"] == 5
    assert fb1_data["feedback_period"] == "general"
    assert fb1_data["is_owner"] is True
    # PRIVACY VERIFICATION: Confirm no student ID or user identity in response!
    assert "student_id" not in fb1_data
    assert "user_id" not in fb1_data
    assert "student_name" not in fb1_data
    assert "email" not in fb1_data
    fb1_id = fb1_data["id"]

    # 4. Prevent duplicate submission for the same period by same student
    dup_res = client.post(
        f"/api/v1/subjects/{subj1_id}/feedback",
        json=fb1_payload,
        headers=student1_headers,
    )
    assert dup_res.status_code == 400
    assert "already submitted feedback" in dup_res.json()["detail"]

    # 5. Student 1 can submit for a different feedback period (e.g. midterm)
    midterm_res = client.post(
        f"/api/v1/subjects/{subj1_id}/feedback",
        json={**fb1_payload, "overall_rating": 4, "feedback_period": "midterm"},
        headers=student1_headers,
    )
    assert midterm_res.status_code == 201
    assert midterm_res.json()["feedback_period"] == "midterm"

    # 6. Student 1 edits their own feedback
    edit_payload = {
        "overall_rating": 5,
        "teaching_clarity_rating": 4,
        "positive_feedback": "Updated: The diagrams and step-by-step math were super helpful.",
    }
    edit_res = client.put(
        f"/api/v1/feedback/{fb1_id}",
        json=edit_payload,
        headers=student1_headers,
    )
    assert edit_res.status_code == 200
    assert edit_res.json()["teaching_clarity_rating"] == 4
    assert "Updated" in edit_res.json()["positive_feedback"]

    # 7. Student 2 cannot edit Student 1's feedback
    unauth_edit_res = client.put(
        f"/api/v1/feedback/{fb1_id}",
        json={"overall_rating": 1},
        headers=student2_headers,
    )
    assert unauth_edit_res.status_code == 403

    # 8. Non-members cannot submit feedback
    outsider_fb_res = client.post(
        f"/api/v1/subjects/{subj1_id}/feedback",
        json=fb1_payload,
        headers=outsider_headers,
    )
    assert outsider_fb_res.status_code == 403

    # 9. Lecturer cannot submit student feedback
    lec_fb_res = client.post(
        f"/api/v1/subjects/{subj1_id}/feedback",
        json=fb1_payload,
        headers=lecturer_headers,
    )
    assert lec_fb_res.status_code == 400

    # 10. Student retrieves their own feedback
    my_fb_res = client.get(
        f"/api/v1/subjects/{subj1_id}/feedback/me?period=general",
        headers=student1_headers,
    )
    assert my_fb_res.status_code == 200
    assert my_fb_res.json()["id"] == fb1_id
    assert "student_id" not in my_fb_res.json()

    # Student 2 has not submitted for general period yet
    s2_fb_res = client.get(
        f"/api/v1/subjects/{subj1_id}/feedback/me?period=general",
        headers=student2_headers,
    )
    assert s2_fb_res.status_code == 200
    assert s2_fb_res.json() is None

    # 11. Student 2 and Student 3 submit feedback to test aggregate analytics
    s2_fb = client.post(
        f"/api/v1/subjects/{subj1_id}/feedback",
        json={
            "overall_rating": 4,
            "teaching_clarity_rating": 4,
            "lecture_pace_rating": 3,
            "concept_understanding_rating": 4,
            "positive_feedback": "Great pacing and enthusiastic lectures.",
            "improvement_suggestions": "Slow down slightly during complex tensor proofs.",
            "feedback_period": "general",
        },
        headers=student2_headers,
    )
    assert s2_fb.status_code == 201

    s3_fb = client.post(
        f"/api/v1/subjects/{subj1_id}/feedback",
        json={
            "overall_rating": 5,
            "teaching_clarity_rating": 5,
            "lecture_pace_rating": 5,
            "concept_understanding_rating": 5,
            "positive_feedback": "Crystal clear explanations of quantum operators.",
            "improvement_suggestions": "More practice problem sessions before exams.",
            "feedback_period": "general",
        },
        headers=student3_headers,
    )
    assert s3_fb.status_code == 201

    # 12. Student cannot access Lecturer Analytics endpoint
    student_analytics_res = client.get(
        f"/api/v1/subjects/{subj1_id}/feedback/analytics",
        headers=student1_headers,
    )
    assert student_analytics_res.status_code == 403

    # 13. Other lecturer cannot access this classroom's analytics
    other_lec_analytics_res = client.get(
        f"/api/v1/subjects/{subj1_id}/feedback/analytics",
        headers=other_lecturer_headers,
    )
    assert other_lec_analytics_res.status_code == 403

    # 14. Authorized Lecturer views Subject Analytics
    analytics_res = client.get(
        f"/api/v1/subjects/{subj1_id}/feedback/analytics?period=general",
        headers=lecturer_headers,
    )
    assert analytics_res.status_code == 200, analytics_res.text
    analytics = analytics_res.json()
    assert analytics["total_submissions"] == 3
    # Ratings: 5, 4, 5 -> avg = (14/3) = 4.67
    assert analytics["average_overall"] == 4.67
    # Clarity: 4, 4, 5 -> avg = (13/3) = 4.33
    assert analytics["average_clarity"] == 4.33
    # Pace: 4, 3, 5 -> avg = (12/3) = 4.0
    assert analytics["average_pace"] == 4.0
    # Understanding: 5, 4, 5 -> avg = (14/3) = 4.67
    assert analytics["average_understanding"] == 4.67
    # Distribution: two 5-stars, one 4-star
    assert analytics["rating_distribution"]["5"] == 2
    assert analytics["rating_distribution"]["4"] == 1
    assert analytics["rating_distribution"]["1"] == 0
    # Data sufficiency
    assert analytics["has_sufficient_data"] is True
    # Themes
    assert len(analytics["positive_themes"]) > 0
    assert len(analytics["improvement_themes"]) > 0
    # Recent feedback items check: ZERO identity leakage!
    assert len(analytics["recent_feedback"]) == 3
    for item in analytics["recent_feedback"]:
        assert "student_id" not in item
        assert "user_id" not in item
        assert "student_name" not in item
        assert "email" not in item
        assert "overall_rating" in item

    # 15. Test Empty Subject Analytics (Subject 2 has 0 feedback)
    subj2_analytics_res = client.get(
        f"/api/v1/subjects/{subj2_id}/feedback/analytics",
        headers=lecturer_headers,
    )
    assert subj2_analytics_res.status_code == 200
    s2_data = subj2_analytics_res.json()
    assert s2_data["total_submissions"] == 0
    assert s2_data["average_overall"] == 0.0
    assert s2_data["has_sufficient_data"] is False
    assert len(s2_data["recent_feedback"]) == 0

    # 16. Test Classroom-Wide Analytics & Subject Breakdown
    classroom_analytics_res = client.get(
        f"/api/v1/classrooms/{classroom_id}/feedback/analytics",
        headers=lecturer_headers,
    )
    assert classroom_analytics_res.status_code == 200
    c_analytics = classroom_analytics_res.json()
    assert c_analytics["classroom_id"] == classroom_id
    # Across both subjects (Subject 1 has 3 general + 1 midterm = 4, Subject 2 has 0)
    assert c_analytics["total_submissions"] == 4
    assert len(c_analytics["subject_breakdown"]) == 2
    s1_entry = next((s for s in c_analytics["subject_breakdown"] if s["subject_id"] == subj1_id), None)
    assert s1_entry is not None
    assert s1_entry["total_submissions"] == 4
    s2_entry = next((s for s in c_analytics["subject_breakdown"] if s["subject_id"] == subj2_id), None)
    assert s2_entry is not None
    assert s2_entry["total_submissions"] == 0

    print("PASS: test_anonymous_feedback_and_analytics")


if __name__ == "__main__":
    print("Running feedback and analytics tests...")
    test_anonymous_feedback_and_analytics()
    print("All feedback & analytics tests passed successfully!")

