import {
  Announcement,
  AnnouncementCreatePayload,
  AnnouncementUpdatePayload,
} from '../types/announcement';
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

export async function createAnnouncement(
  token: string,
  classroomId: number,
  payload: AnnouncementCreatePayload
): Promise<Announcement> {
  const res = await fetch(`${API_BASE_URL}/api/v1/classrooms/${classroomId}/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Announcement>(res);
}

export async function getClassroomAnnouncements(
  token: string,
  classroomId: number,
  subjectId?: number,
  includeGeneral: boolean = true
): Promise<Announcement[]> {
  const params = new URLSearchParams();
  if (subjectId !== undefined && subjectId !== null) {
    params.append('subject_id', String(subjectId));
    params.append('include_general', String(includeGeneral));
  }

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(
    `${API_BASE_URL}/api/v1/classrooms/${classroomId}/announcements${queryStr}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return handleResponse<Announcement[]>(res);
}

export async function getAnnouncementDetail(
  token: string,
  announcementId: number
): Promise<Announcement> {
  const res = await fetch(`${API_BASE_URL}/api/v1/announcements/${announcementId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Announcement>(res);
}

export async function updateAnnouncement(
  token: string,
  announcementId: number,
  payload: AnnouncementUpdatePayload
): Promise<Announcement> {
  const res = await fetch(`${API_BASE_URL}/api/v1/announcements/${announcementId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Announcement>(res);
}

export async function deleteAnnouncement(
  token: string,
  announcementId: number
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/announcements/${announcementId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ success: boolean; message: string }>(res);
}

