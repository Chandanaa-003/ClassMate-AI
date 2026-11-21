import { HealthCheckResponse } from '../types/health';

export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '');

export async function fetchHealth(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check request failed with status: ${response.status}`);
  }
  return response.json();
}

