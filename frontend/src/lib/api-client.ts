const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    credentials: 'include', // Send cookies for auth
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  const data = await res.json();

  if (!res.ok) {
    throw data;
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) => request<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body: unknown) => request<T>(endpoint, { method: 'PUT', body }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
