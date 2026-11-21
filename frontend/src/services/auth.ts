import { AuthResponse, DashboardResponse, LoginPayload, RegisterPayload, User } from '../types/auth';
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

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(res);
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(res);
}

export async function getCurrentUser(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<User>(res);
}

export async function getStudentDashboard(token: string): Promise<DashboardResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/student/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<DashboardResponse>(res);
}

export async function getLecturerDashboard(token: string): Promise<DashboardResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/lecturer/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<DashboardResponse>(res);
}

