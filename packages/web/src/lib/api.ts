/**
 * Centralized API client for ZKGov
 *
 * All API calls go through this module. Benefits:
 * - Single place to set auth headers
 * - Consistent error handling
 * - Easy to mock for testing
 * - Base URL configured once
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

// ─── Proposals ───────────────────────────────────────

// ─── Stats ───────────────────────────────────────────

export function fetchStats() {
  return request<{ proposals: number; votes: number; voters: number; agents: number }>('/api/stats');
}

export function fetchActivity() {
  return request<{ activity: { id: string; type: string; platform: string; text: string; proposalId: number; time: string }[] }>('/api/activity');
}

// ─── Proposals ───────────────────────────────────────

export interface ProposalsResponse {
  proposals: any[];
  pagination: { page: number; limit: number; total: number };
}

export function fetchProposals(params?: { status?: string; page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.status && params.status !== 'all') search.set('status', params.status);
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return request<ProposalsResponse>(`/api/proposals${qs ? `?${qs}` : ''}`);
}

export function fetchProposal(id: string | number) {
  return request<{ proposal: any }>(`/api/proposals/${id}`);
}

export function createProposal(data: {
  title: string;
  description: string;
  votingPeriod: number;
  quorum: number;
  voterGroup: string;
}) {
  return request<{ proposal: any }>('/api/proposals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Voting ──────────────────────────────────────────

export function castVote(proposalId: number, choice: 0 | 1 | 2, platform = 'web') {
  return request<{ status: string; txHash: string }>('/api/votes', {
    method: 'POST',
    headers: { 'X-Platform': platform },
    body: JSON.stringify({ proposalId, choice }),
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

// ─── Agents ──────────────────────────────────────────

export function fetchAgents() {
  return request<{ agents: any[] }>('/api/agents');
}

export function fetchMyAgents() {
  return request<{ agents: any[] }>('/api/agents/mine');
}

export function registerAgent(name: string, onChainAddress?: string) {
  return request<{ agent: any }>('/api/agents', {
    method: 'POST',
    body: JSON.stringify({ name, onChainAddress }),
  });
}

export function deleteAgent(id: string) {
  return request<{ status: string }>(`/api/agents/${id}`, { method: 'DELETE' });
}

// ─── Auth ────────────────────────────────────────────

export function register(walletAddress: string, signature: string, nonce: string) {
  return request<{ token: string; user: any }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, signature, nonce }),
  });
}

export function verifyKyc() {
  return request<any>('/api/auth/verify-kyc', { method: 'POST' });
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
