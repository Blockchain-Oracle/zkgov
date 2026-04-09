/**
 * API client for ZKGov backend.
 * Most data now comes from the contract (via wagmi hooks).
 * The backend only handles: auth, comments, and platform linking.
 */

import { API_URL } from './constants';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zkgov_token');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error || res.statusText);
  }
  return res.json();
}

// ─── Auth ────────────────────────────────────────────

export function register(walletAddress: string, signature: string, nonce: string) {
  return request<{ token: string; user: any }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, signature, nonce }),
  });
}

export function getMe() {
  return request<any>('/api/auth/me');
}

export function linkTelegram(initData: string) {
  return request<any>('/api/auth/link/telegram', {
    method: 'POST',
    body: JSON.stringify({ initData }),
  });
}

// ─── Comments ────────────────────────────────────────

export function fetchComments(proposalId: number | string) {
  return request<{ comments: any[] }>(`/api/proposals/${proposalId}/comments`);
}

export function postComment(proposalId: number | string, content: string, parentId?: string) {
  return request<{ comment: any }>(`/api/proposals/${proposalId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, parentId, commentType: 'comment' }),
  });
}

// ─── Stats (from contract via backend proxy) ─────────

export function fetchStats() {
  return request<{ proposals: number; members: number; comments: number }>('/api/stats');
}
