import {
  FeedbackCreatePayload,
  FeedbackUpdatePayload,
  FeedbackResponse,
  SubjectAnalyticsResponse,
  ClassroomAnalyticsResponse,
} from '../types/feedback';
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

export async function submitFeedback(
  token: string,
  subjectId: number,
  payload: FeedbackCreatePayload
): Promise<FeedbackResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<FeedbackResponse>(res);
}

export async function updateFeedback(
  token: string,
  feedbackId: number,
  payload: FeedbackUpdatePayload
): Promise<FeedbackResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/feedback/${feedbackId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<FeedbackResponse>(res);
}

export async function getMyFeedback(
  token: string,
  subjectId: number,
  period: string = 'general'
): Promise<FeedbackResponse | null> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/subjects/${subjectId}/feedback/me?feedback_period=${encodeURIComponent(
      period
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<FeedbackResponse | null>(res);
}

export async function getSubjectAnalytics(
  token: string,
  subjectId: number,
  period?: string
): Promise<SubjectAnalyticsResponse> {
  const query = period && period !== 'all' ? `?period=${encodeURIComponent(period)}` : '';
  const res = await fetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/feedback/analytics${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<SubjectAnalyticsResponse>(res);
}

export async function getClassroomAnalytics(
  token: string,
  classroomId: number,
  period?: string
): Promise<ClassroomAnalyticsResponse> {
  const query = period && period !== 'all' ? `?period=${encodeURIComponent(period)}` : '';
  const res = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/feedback/analytics${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<ClassroomAnalyticsResponse>(res);
}

