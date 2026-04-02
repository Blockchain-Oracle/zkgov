'use client';

import { use, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/constants';
import { Shield, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import type { ProposalResponse } from '@zkgov/shared';

type VoteState = 'idle' | 'voting' | 'success' | 'error';

export default function TelegramVotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [proposal, setProposal] = useState<ProposalResponse | null>(null);
  const [voteState, setVoteState] = useState<VoteState>('idle');
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);

  // Get Telegram WebApp and authenticate
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      // Validate initData with backend to get JWT
      const initData = tg.initData;
      if (initData) {
        fetch(`${API_URL}/api/auth/link/telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.token) setToken(data.token);
          })
          .catch(() => {});
      }
    }

    // Fetch proposal
    fetch(`${API_URL}/api/proposals/${id}`)
      .then(res => res.json())
      .then(data => setProposal(data.proposal))
      .catch(() => setError('Failed to load proposal'));
  }, [id]);

  const castVote = async (choice: 0 | 1 | 2) => {
    if (!token) {
      setError('Not authenticated. Please register first.');
      return;
    }

    setVoteState('voting');
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Platform': 'telegram',
        },
        body: JSON.stringify({ proposalId: parseInt(id), choice }),
      });

      const data = await res.json();

      if (res.ok) {
        setVoteState('success');
        // Auto-close after 2 seconds
        setTimeout(() => {
          const tg = (window as any).Telegram?.WebApp;
          if (tg) tg.close();
        }, 2000);
      } else {
        setError(data.error || 'Vote failed');
        setVoteState('error');
      }
    } catch {
      setError('Network error');
      setVoteState('error');
    }
  };

  // Loading
  if (!proposal && !error) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] dark:bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // Success state
  if (voteState === 'success') {
    return (
      <div className="min-h-screen bg-[#F5F2EB] dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Vote Cast</h1>
        <p className="text-zinc-500 text-sm">
          Your anonymous vote has been submitted. Closing...
        </p>
      </div>
    );
  }

  // Voting in progress
  if (voteState === 'voting') {
    return (
      <div className="min-h-screen bg-[#F5F2EB] dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-4">
          <Shield className="w-16 h-16 text-indigo-400" />
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin absolute -bottom-1 -right-1" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Generating ZK Proof</h1>
        <p className="text-zinc-500 text-sm">
          Verifying your eligibility without revealing your identity...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB] dark:bg-[#0a0a0a] flex flex-col p-5">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold tracking-[0.15em] text-zinc-600 uppercase mb-2">
          Proposal #{id.padStart(3, '0')}
        </p>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
          {proposal?.title}
        </h1>
      </div>

      {/* Current votes */}
      {proposal && (
        <div className="mb-6 space-y-2">
          {[
            { label: 'For', count: proposal.votes.for, total: proposal.totalVotes, color: 'bg-emerald-500' },
            { label: 'Against', count: proposal.votes.against, total: proposal.totalVotes, color: 'bg-rose-500' },
            { label: 'Abstain', count: proposal.votes.abstain, total: proposal.totalVotes, color: 'bg-indigo-500' },
          ].map(v => (
            <div key={v.label} className="flex items-center gap-3">
              <span className="text-[10px] font-bold tracking-wider text-zinc-500 w-14 uppercase">{v.label}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", v.color)}
                  style={{ width: v.total > 0 ? `${(v.count / v.total) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-[11px] font-mono text-zinc-600 w-6 text-right">{v.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Vote buttons */}
      <div className="flex-1 flex flex-col justify-center gap-3">
        <button
          onClick={() => castVote(1)}
          className="w-full py-5 rounded-sm border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-bold text-sm tracking-wider uppercase transition-all active:scale-[0.97] hover:bg-emerald-500/10 hover:border-emerald-500/40"
        >
          Vote For
        </button>
        <button
          onClick={() => castVote(0)}
          className="w-full py-5 rounded-sm border border-rose-500/20 bg-rose-500/5 text-rose-400 font-bold text-sm tracking-wider uppercase transition-all active:scale-[0.97] hover:bg-rose-500/10 hover:border-rose-500/40"
        >
          Vote Against
        </button>
        <button
          onClick={() => castVote(2)}
          className="w-full py-5 rounded-sm border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 font-bold text-sm tracking-wider uppercase transition-all active:scale-[0.97] hover:bg-indigo-500/10 hover:border-indigo-500/40"
        >
          Abstain
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-center gap-2 text-rose-400 text-xs">
          <XCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* ZK badge */}
      <div className="mt-6 flex items-center justify-center gap-2 text-zinc-700">
        <Shield size={12} />
        <span className="text-[9px] font-bold tracking-[0.15em] uppercase">
          Zero-knowledge verified · Anonymous
        </span>
      </div>
    </div>
  );
}
