import { CreateSubjectPayload, Subject, UpdateSubjectPayload } from '../types/subject';
import { API_BASE_URL } from './api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        if (typeof errorJson.detail === 'string') {
          errorDetail = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail
            .map((d: { msg?: string }) => d.msg || '')
            .filter(Boolean)
            .join('; ');
        }
      }
    } catch {
      // response is not json
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export async function getClassroomSubjects(token: string, classroomId: number): Promise<Subject[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/subjects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Subject[]>(res);
}

export async function getSubject(token: string, subjectId: number): Promise<Subject> {
  const res = await fetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Subject>(res);
}

export async function createSubject(
  token: string,
  classroomId: number,
  payload: CreateSubjectPayload
): Promise<Subject> {
  const res = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/subjects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Subject>(res);
}

export async function updateSubject(
  token: string,
  subjectId: number,
  payload: UpdateSubjectPayload
): Promise<Subject> {
  const res = await fetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Subject>(res);
}

export async function deleteSubject(
  token: string,
  subjectId: number
): Promise<{ message: string; subject_id: number }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ message: string; subject_id: number }>(res);
}

