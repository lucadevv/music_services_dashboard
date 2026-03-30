const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const fetchClient = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const adminKey = sessionStorage.getItem('adminKey');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(adminKey ? { 
      'X-Admin-Key': adminKey,
      'Authorization': `Bearer ${adminKey}`
    } : {}),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: 'Network error or unparseable JSON' };
      }
      throw new ApiError(response.status, errorData.detail || errorData.message || 'API request failed');
    }
    
    // Status 204 means No Content, json parsing would fail
    if (response.status === 204) {
       return {} as T;
    }
    return await response.json() as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new Error(err.message || 'Unknown network error');
  }
};
