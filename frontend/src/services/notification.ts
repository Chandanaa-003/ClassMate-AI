import {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
  MarkReadResponse,
} from '../types/notification';
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

export async function getNotifications(
  token: string,
  isRead?: boolean,
  limit: number = 50,
  skip: number = 0
): Promise<NotificationListResponse> {
  const params = new URLSearchParams();
  if (isRead !== undefined) {
    params.append('is_read', String(isRead));
  }
  params.append('limit', String(limit));
  params.append('skip', String(skip));

  const res = await fetch(`${API_BASE_URL}/api/v1/notifications?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<NotificationListResponse>(res);
}

export async function getUnreadCount(token: string): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/api/v1/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse<UnreadCountResponse>(res);
  return data.unread_count;
}

export async function markAsRead(token: string, notificationId: number): Promise<Notification> {
  const res = await fetch(`${API_BASE_URL}/api/v1/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Notification>(res);
}

export async function markAllAsRead(token: string): Promise<MarkReadResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<MarkReadResponse>(res);
}

export async function deleteNotification(
  token: string,
  notificationId: number
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ success: boolean; message: string }>(res);
}

