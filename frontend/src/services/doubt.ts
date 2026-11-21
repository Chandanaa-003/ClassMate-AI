import { Answer, CreateAnswerPayload, CreateDoubtPayload, Doubt, VoteResponse } from '../types/doubt';
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

export async function getSubjectDoubts(
  token: string,
  subjectId: number,
  search?: string,
  filterBy: string = 'latest'
): Promise<Doubt[]> {
  const params = new URLSearchParams();
  if (search && search.trim()) {
    params.append('search', search.trim());
  }
  if (filterBy) {
    params.append('filter_by', filterBy);
  }

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/doubts${queryStr}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Doubt[]>(res);
}

export async function getDoubtDetail(token: string, doubtId: number): Promise<Doubt> {
  const res = await fetch(`${API_BASE_URL}/api/v1/doubts/${doubtId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Doubt>(res);
}

export async function createDoubt(
  token: string,
  subjectId: number,
  payload: CreateDoubtPayload
): Promise<Doubt> {
  const res = await fetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/doubts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Doubt>(res);
}

export async function createAnswer(
  token: string,
  doubtId: number,
  payload: CreateAnswerPayload
): Promise<Answer> {
  const res = await fetch(`${API_BASE_URL}/api/v1/doubts/${doubtId}/answers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Answer>(res);
}

export async function voteAnswer(token: string, answerId: number): Promise<VoteResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/answers/${answerId}/vote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<VoteResponse>(res);
}

export async function acceptAnswer(token: string, answerId: number): Promise<Answer> {
  const res = await fetch(`${API_BASE_URL}/api/v1/answers/${answerId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Answer>(res);
}

export async function deleteDoubt(
  token: string,
  doubtId: number
): Promise<{ message: string; doubt_id: number }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/doubts/${doubtId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ message: string; doubt_id: number }>(res);
}

