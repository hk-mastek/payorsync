// Centralized API Configuration
// Uses environment variables to determine the API base URL

// Check if we're in development/local mode
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

// API Base URL - uses environment variable if set, otherwise falls back to localhost for local dev
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isDevelopment ? 'http://localhost:8000' : '');

// API Endpoints
export const API_ENDPOINTS = {
  // Dashboard endpoints
  dashboardSummary: `${API_BASE_URL}/api/v1/dashboard/summary`,

  // Variance endpoints
  variances: `${API_BASE_URL}/api/v1/variances`,
  varianceDetail: (id: string) => `${API_BASE_URL}/api/v1/variances/${id}`,
} as const;

// Helper to build URL with query params
export function buildUrl(baseUrl: string, params: Record<string, string | number | undefined>): string {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

