const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Token boshqaruvi
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Universal fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    clearTokens();
    window.location.href = '/admin/login';
    throw new Error('Sessiya tugadi');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Xato yuz berdi');
  return data;
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const data = await apiFetch<{
      success: boolean;
      data: { accessToken: string; refreshToken: string; user: User };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  logout: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      clearTokens();
    }
  },

  getMe: async () => {
    return apiFetch<{ success: boolean; data: User }>('/auth/me');
  },
};

// Sertifikat API
export const certificateApi = {
  verify: async (serialNumber: string) => {
    const res = await fetch(`${API_BASE}/verify/${encodeURIComponent(serialNumber)}`);
    return res.json();
  },

  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    return apiFetch<{ success: boolean; data: Certificate[]; meta: Meta }>(
      `/certificates?${query}`
    );
  },

  getById: async (id: string) => {
    return apiFetch<{ success: boolean; data: Certificate }>(`/certificates/${id}`);
  },

  create: async (data: Partial<Certificate>) => {
    return apiFetch<{ success: boolean; data: Certificate }>('/certificates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  upload: async (formData: FormData) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/certificates/upload`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    return result;
  },

  update: async (id: string, data: Partial<Certificate>) => {
    return apiFetch<{ success: boolean; data: Certificate }>(`/certificates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  revoke: async (id: string) => {
    return apiFetch(`/certificates/${id}/revoke`, { method: 'POST' });
  },

  reissue: async (id: string) => {
    return apiFetch(`/certificates/${id}/reissue`, { method: 'POST' });
  },
};

// Users API
export const usersApi = {
  getAll: async () => apiFetch<{ success: boolean; data: User[] }>('/users'),
  create: async (data: { full_name: string; email: string; password: string; role: string }) =>
    apiFetch('/users', { method: 'POST', body: JSON.stringify(data) }),
  delete: async (id: string) => apiFetch(`/users/${id}`, { method: 'DELETE' }),
  updateRole: async (id: string, role: string) =>
    apiFetch(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  resetPassword: async (id: string, password: string) =>
    apiFetch(`/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) }),
};

// Audit API
export const auditApi = {
  getLogs: async (params?: { page?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    return apiFetch<{ success: boolean; data: AuditLog[]; meta: Meta }>(`/audit-logs?${query}`);
  },
};

// Types
export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'operator' | 'super_admin';
  created_at: string;
}

export interface Certificate {
  id: string;
  serial_series: string;
  serial_number: string;
  full_name: string;
  course_name: string;
  course_description?: string;
  course_start_date: string;
  course_end_date: string;
  status: 'active' | 'revoked';
  file_url?: string;
  qr_code_url?: string;
  is_generated: boolean;
  created_at: string;
  updated_at: string;
  created_by?: { full_name: string; email: string };
  is_valid?: boolean;
  is_revoked?: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  ip_address?: string;
  user: { full_name: string; email: string };
  certificate?: { serial_number: string; full_name: string };
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
