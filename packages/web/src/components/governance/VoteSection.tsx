'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, CheckCircle2, Loader2, AlertCircle, Info } from 'lucide-react';
import type { ProposalResponse, VoteChoice } from '@zkgov/shared';

interface VoteSectionProps {
  proposal: ProposalResponse;
  onVoteSuccess?: () => void;
}

export function VoteSection({ proposal, onVoteSuccess }: VoteSectionProps) {
  const { isConnected } = useAccount();
  const { user, login, isSigning, token, refreshUser } = useAuth();
  const [votingState, setVotingState] = useState<'idle' | 'registering' | 'proving' | 'submitting' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  // Check if user has already voted on this proposal
  useEffect(() => {
    if (!token || !proposal?.id) return;
    fetch(`${API_URL}/api/votes/check/${proposal.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (data.hasVoted) setHasVoted(true); })
      .catch(() => {});
  }, [token, proposal?.id]);

  // KYC registration is handled by the backend (relayer calls setHuman on-chain)

  // Handle KYC -> On-chain Registration flow
  const handleRegisterOnChain = async () => {
    if (!token) return;
    setVotingState('registering');
    setError(null);

    try {
      // Backend calls MockKycSBT.setHuman() via relayer — approves user on-chain
      const res = await fetch(`${API_URL}/api/auth/verify-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'KYC verification failed');

      // Refresh user state — they're now KYC'd
      refreshUser();
      setVotingState('idle');
    } catch (err: any) {
      setError(err.message);
      setVotingState('idle');
    }
  };

  // Handle Voting (ZK Proof Generation + Relayer submission)
  const handleVote = async (choice: VoteChoice) => {
    if (!token) return;
    setVotingState('proving');
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/votes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Platform': 'web'
        },
        body: JSON.stringify({ proposalId: proposal.id, choice }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Voting failed');

      setTxHash(data.txHash);
      setVotingState('success');
      onVoteSuccess?.();
    } catch (err: any) {
      setError(err.message);
      setVotingState('idle');
    }
  };

  // 1. Not connected
  if (!isConnected) {
    return (
      <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2 text-zinc-500">
          <Shield size={24} />
        </div>
        <h3 className="text-sm font-bold tracking-tight uppercase">Governance Gate</h3>
        <p className="text-xs text-zinc-500">Connect your wallet to participate in the ZK governance layer.</p>
        <appkit-button />
      </Card>
    );
  }

  // 2. Connected but not signed in (no ZK identity)
  if (!user) {
    return (
      <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-4">
        <h3 className="text-sm font-bold tracking-tight uppercase">Identity Required</h3>
        <p className="text-xs text-zinc-500">Create your anonymous voter identity to cast private votes.</p>
        <Button 
          onClick={login} 
          disabled={isSigning}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-[11px] font-bold tracking-[0.1em] h-11"
        >
          {isSigning ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
          {isSigning ? 'SIGNING...' : 'SIGN IN TO VOTE'}
        </Button>
      </Card>
    );
  }

  // 3. Not KYC'd or Registered on-chain
  // Based on my code review, kycVerified in DB is only true AFTER /verify-kyc
  // But we also need the user to be added to the Semaphore group on-chain.
  if (!user.kycVerified) {
    return (
      <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-4">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertCircle size={16} />
          <h3 className="text-xs font-bold tracking-widest uppercase">KYC Verification Needed</h3>
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-500">
          This is a verified proposal. To ensure one-person-one-vote, you must prove your KYC status on-chain once. 
          Your voting remains fully anonymous.
        </p>
        <Button 
          onClick={handleRegisterOnChain} 
          disabled={votingState === 'registering' }
          className="w-full bg-white text-black hover:bg-zinc-200 text-[11px] font-bold tracking-[0.1em] h-11"
        >
          {votingState === 'registering'  ? (
            <Loader2 className="animate-spin mr-2" size={14} />
          ) : null}
          {'VERIFY & REGISTER'}
        </Button>
      </Card>
    );
  }

  // 4. Already voted
  if (hasVoted && votingState !== 'success') {
    return (
      <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-4 text-center">
        <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
        <h3 className="text-sm font-bold tracking-tight uppercase">Vote Recorded</h3>
        <p className="text-xs text-zinc-500">
          You have already voted on this proposal. Your vote is anonymous and verified by a zero-knowledge proof.
        </p>
      </Card>
    );
  }

  // 5. Ready to vote (or success)
  return (
    <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400">
          <Shield size={16} />
          <h3 className="text-xs font-bold tracking-widest uppercase">Private Ballot</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">KYC: {user.kycLevel}</span>
        </div>
      </div>

      {votingState === 'success' ? (
        <div className="flex flex-col items-center gap-4 py-4 animate-in">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Vote Submitted</p>
            <p className="text-[11px] text-zinc-500 mt-1">Your ZK-verified ballot has been cast.</p>
          </div>
          <a 
            href={`https://testnet-explorer.hsk.xyz/tx/${txHash}`}
            target="_blank"
            className="text-[10px] font-mono text-indigo-400/70 hover:text-indigo-400 break-all text-center px-4"
          >
            {txHash}
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] leading-relaxed text-zinc-500">
            A zero-knowledge proof will verify your membership without revealing your identity.
          </p>
          
          <div className="flex flex-col gap-2">
            {[
              { label: 'FOR', value: 1, color: 'hover:bg-emerald-500 hover:text-black hover:border-emerald-500' },
              { label: 'AGAINST', value: 0, color: 'hover:bg-rose-500 hover:text-black hover:border-rose-500' },
              { label: 'ABSTAIN', value: 2, color: 'hover:bg-zinc-300 hover:text-black hover:border-zinc-300' },
            ].map((choice) => (
              <Button
                key={choice.label}
                variant="outline"
                onClick={() => handleVote(choice.value as VoteChoice)}
                disabled={votingState !== 'idle'}
                className={cn(
                  "w-full py-3 bg-[#F5F2EB] dark:bg-[#0a0a0a] border border-black/[0.08] dark:border-white/[0.08] text-zinc-900 dark:text-white font-bold text-[11px] tracking-[0.2em] rounded-sm transition-all flex items-center justify-center uppercase",
                  votingState === 'idle' ? choice.color : 'opacity-50 cursor-not-allowed'
                )}
              >
                {votingState === 'proving' ? (
                  <>
                    <Loader2 className="animate-spin mr-3" size={14} />
                    GENERATING PROOF...
                  </>
                ) : (
                  choice.label
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-sm flex gap-3">
          <AlertCircle className="text-rose-400 shrink-0" size={14} />
          <p className="text-[10px] text-rose-400/90 leading-tight">{error}</p>
        </div>
      )}

      <div className="flex items-start gap-3 p-3 bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] rounded-sm">
        <Info className="text-zinc-500 shrink-0 mt-0.5" size={14} />
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          The ZKGov relayer handles gas costs for all votes. Your transaction is indistinguishable from others in the voter group.
        </p>
      </div>
    </Card>
  );
}
