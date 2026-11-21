import {
  Classroom,
  ClassroomDetail,
  ClassroomMember,
  CreateClassroomPayload,
  JoinClassroomPayload,
} from '../types/classroom';
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

export async function getClassrooms(token: string): Promise<Classroom[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/classrooms`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Classroom[]>(res);
}

export async function getClassroomDetail(token: string, classroomId: number): Promise<ClassroomDetail> {
  const res = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<ClassroomDetail>(res);
}

export async function getClassroomMembers(token: string, classroomId: number): Promise<ClassroomMember[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<ClassroomMember[]>(res);
}

export async function createClassroom(
  token: string,
  payload: CreateClassroomPayload
): Promise<Classroom> {
  const res = await fetch(`${API_BASE_URL}/api/v1/classrooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Classroom>(res);
}

export async function joinClassroom(
  token: string,
  payload: JoinClassroomPayload
): Promise<Classroom> {
  const res = await fetch(`${API_BASE_URL}/api/v1/classrooms/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Classroom>(res);
}

export async function leaveClassroom(
  token: string,
  classroomId: number
): Promise<{ message: string; classroom_id: number }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/leave`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ message: string; classroom_id: number }>(res);
}

