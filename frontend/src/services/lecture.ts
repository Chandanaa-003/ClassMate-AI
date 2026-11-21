import { Lecture, LectureDeleteResponse, LectureReviewPayload } from '../types/lecture';
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
          errorDetail = errorJson.detail.map((d: { msg?: string }) => d.msg || '').filter(Boolean).join('; ');
        }
      }
    } catch {
      // response is not json
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export function getLectureAudioStreamUrl(token: string, lectureId: number): string {
  return `${API_BASE_URL}/api/v1/lectures/${lectureId}/audio?token=${encodeURIComponent(token)}`;
}

export async function getSubjectLectures(
  token: string,
  subjectId: number,
  options?: { status?: string; mine?: boolean }
): Promise<Lecture[]> {
  const query = new URLSearchParams();
  if (options?.status) query.set('status', options.status);
  if (options?.mine) query.set('mine', 'true');

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/lectures${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<Lecture[]>(res);
}

export async function getLecture(token: string, lectureId: number): Promise<Lecture> {
  const res = await fetch(`${API_BASE_URL}/api/v1/lectures/${lectureId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<Lecture>(res);
}

export async function uploadLecture(token: string, subjectId: number, formData: FormData): Promise<Lecture> {
  const res = await fetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/lectures/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Note: Do NOT set Content-Type header when sending FormData; browser sets multipart/form-data with boundary automatically
    },
    body: formData,
  });
  return handleResponse<Lecture>(res);
}

export async function reviewLecture(
  token: string,
  lectureId: number,
  payload: LectureReviewPayload
): Promise<Lecture> {
  const res = await fetch(`${API_BASE_URL}/api/v1/lectures/${lectureId}/review`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Lecture>(res);
}

export async function deleteLecture(token: string, lectureId: number): Promise<LectureDeleteResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/lectures/${lectureId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<LectureDeleteResponse>(res);
}

