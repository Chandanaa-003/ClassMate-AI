export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | string;
  project_name: string;
  environment: string;
  database: 'connected' | 'disconnected' | string;
  version: string;
  timestamp: string;
}

