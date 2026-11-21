import { ChatResponse, Conversation, SmartNote, Transcript } from '../types/ai';
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

export async function transcribeLecture(
  token: string,
  lectureId: number,
  options?: { force_retry?: boolean; language?: string }
): Promise<Transcript> {
  const res = await fetch(`${API_BASE_URL}/api/v1/lectures/${lectureId}/transcribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      force_retry: !!options?.force_retry,
      language: options?.language || null,
    }),
  });
  return handleResponse<Transcript>(res);
}

export async function getLectureTranscript(token: string, lectureId: number): Promise<Transcript> {
  const res = await fetch(`${API_BASE_URL}/api/v1/lectures/${lectureId}/transcript`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<Transcript>(res);
}

export async function updateLectureTranscript(
  token: string,
  lectureId: number,
  text: string
): Promise<Transcript> {
  const res = await fetch(`${API_BASE_URL}/api/v1/lectures/${lectureId}/transcript`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcript_text: text }),
  });
  return handleResponse<Transcript>(res);
}

export async function generateLectureNotes(
  token: string,
  lectureId: number,
  force_retry: boolean = false
): Promise<SmartNote> {
  const res = await fetch(`${API_BASE_URL}/api/v1/lectures/${lectureId}/generate-notes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ force_retry }),
  });
  return handleResponse<SmartNote>(res);
}

export async function getLectureNotes(token: string, lectureId: number): Promise<SmartNote> {
  const res = await fetch(`${API_BASE_URL}/api/v1/lectures/${lectureId}/notes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<SmartNote>(res);
}

export async function askClassroomAssistant(
  token: string,
  subjectId: number,
  question: string,
  options?: { conversationId?: number; lectureId?: number }
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      conversation_id: options?.conversationId || null,
      lecture_id: options?.lectureId || null,
    }),
  });
  return handleResponse<ChatResponse>(res);
}

export async function getSubjectConversations(
  token: string,
  subjectId: number
): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/chat/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<Conversation[]>(res);
}

export async function getConversationDetail(
  token: string,
  conversationId: number
): Promise<Conversation> {
  const res = await fetch(`${API_BASE_URL}/api/v1/chat/conversations/${conversationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<Conversation>(res);
}

export async function deleteConversation(
  token: string,
  conversationId: number
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/chat/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<{ success: boolean; message: string }>(res);
}


