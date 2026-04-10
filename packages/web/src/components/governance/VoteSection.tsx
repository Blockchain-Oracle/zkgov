'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Group, generateProof } from '@semaphore-protocol/core';
import { SemaphoreEthers } from '@semaphore-protocol/data';
import { useAuth } from '@/hooks/useAuth';
import { useSemaphoreIdentity } from '@/hooks/useSemaphoreIdentity';
import { useIsVoter, useRegister, useCastVoteTx } from '@/hooks/useZKVoting';
import { EXPLORER_URL, SEMAPHORE_ADDRESS } from '@/lib/contracts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Shield, CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import type { Proposal } from '@zkgov/shared';
import { HASHKEY_TESTNET, DEPLOYMENT_BLOCK } from '@zkgov/shared';

interface VoteSectionProps {
  proposal: Proposal;
  onVoteSuccess?: () => void;
}

export function VoteSection({ proposal, onVoteSuccess }: VoteSectionProps) {
  const { isConnected, address } = useAccount();
  const { user, login, isSigning } = useAuth();
  const { identity, commitment, createIdentity, isCreating, hasIdentity } = useSemaphoreIdentity();
  const { data: voterData } = useIsVoter(address as `0x${string}`);
  const { register, isPending: isRegistering, isSuccess: regSuccess, hash: regHash, error: regError } = useRegister();
  const { vote, isPending: isVoting, isConfirming, isSuccess: voteSuccess, hash: voteHash, error: voteError } = useCastVoteTx();

  const [proofState, setProofState] = useState<'idle' | 'generating'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const isRegistered = !!(voterData as any)?.[0];

  // localStorage key per (address, proposalId) so state survives refresh
  const votedKey = address ? `zkgov:voted:${address.toLowerCase()}:${proposal.id}` : null;

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (votedKey && typeof window !== 'undefined') {
      if (localStorage.getItem(votedKey) === '1') {
        setHasVoted(true);
      }
    }
  }, [votedKey]);

  // Persist vote state to localStorage whenever it flips true
  useEffect(() => {
    if (hasVoted && votedKey) {
      localStorage.setItem(votedKey, '1');
    }
  }, [hasVoted, votedKey]);

  // Detect vote success or "already voted" error
  useEffect(() => {
    if (voteSuccess) setHasVoted(true);
  }, [voteSuccess]);

  useEffect(() => {
    if (voteError) {
      const msg = (voteError as any)?.message || (voteError as any)?.shortMessage || '';
      if (msg.includes('Nullifier') || msg.includes('nullifier') || msg.includes('already')) {
        setHasVoted(true);
      }
    }
  }, [voteError]);

  // Check if voting has ended (time window closed OR finalized)
  const votingEnded = proposal.finalized || !proposal.isActive || (proposal.votingEnd && proposal.votingEnd < Date.now());

  // 0. Voting has ended — show final state, no vote UI
  if (votingEnded) {
    const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
    const maxVotes = Math.max(proposal.votesFor, proposal.votesAgainst, proposal.votesAbstain, 1);
    const quorumReached = totalVotes >= proposal.quorum;
    const winning = proposal.votesFor > proposal.votesAgainst && quorumReached;

    let statusLabel = 'VOTING ENDED';
    let statusColor = 'text-zinc-400';
    let statusBg = 'bg-zinc-500/10 border-zinc-500/30';

    if (proposal.finalized) {
      if (proposal.passed) {
        statusLabel = 'PROPOSAL PASSED';
        statusColor = 'text-emerald-400';
        statusBg = 'bg-emerald-500/10 border-emerald-500/30';
      } else {
        statusLabel = 'PROPOSAL DEFEATED';
        statusColor = 'text-rose-400';
        statusBg = 'bg-rose-500/10 border-rose-500/30';
      }
    } else {
      statusLabel = quorumReached
        ? (winning ? 'PASSING — AWAITING FINALIZATION' : 'ENDED — AWAITING FINALIZATION')
        : 'ENDED — QUORUM NOT REACHED';
    }

    return (
      <Card className={cn("p-6 bg-[#EBE8E1] dark:bg-[#111] border flex flex-col gap-5", statusBg)}>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", proposal.finalized ? (proposal.passed ? 'bg-emerald-400' : 'bg-rose-400') : 'bg-zinc-400')}></div>
          <h3 className={cn("text-[10px] font-bold tracking-[0.2em] uppercase", statusColor)}>{statusLabel}</h3>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">For</span>
              <span className="text-xs font-mono text-zinc-400">{proposal.votesFor}</span>
            </div>
            <div className="h-1.5 bg-black/10 dark:bg-white/5 rounded-sm overflow-hidden">
              <div className="h-full bg-emerald-500/70" style={{ width: `${(proposal.votesFor / maxVotes) * 100}%` }}></div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Against</span>
              <span className="text-xs font-mono text-zinc-400">{proposal.votesAgainst}</span>
            </div>
            <div className="h-1.5 bg-black/10 dark:bg-white/5 rounded-sm overflow-hidden">
              <div className="h-full bg-rose-500/70" style={{ width: `${(proposal.votesAgainst / maxVotes) * 100}%` }}></div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Abstain</span>
              <span className="text-xs font-mono text-zinc-400">{proposal.votesAbstain}</span>
            </div>
            <div className="h-1.5 bg-black/10 dark:bg-white/5 rounded-sm overflow-hidden">
              <div className="h-full bg-zinc-500/70" style={{ width: `${(proposal.votesAbstain / maxVotes) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Quorum</span>
          <span className="text-[10px] font-mono text-zinc-400">{totalVotes} / {proposal.quorum} {quorumReached ? '✓' : '—'}</span>
        </div>
      </Card>
    );
  }

  // 1. Not connected
  if (!isConnected) {
    return (
      <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-4 text-center">
        <Shield size={32} className="text-zinc-400 mx-auto" />
        <h3 className="text-sm font-bold tracking-tight uppercase">Connect Wallet</h3>
        <p className="text-xs text-zinc-500">Connect your wallet to participate in ZK governance.</p>
        <appkit-button />
      </Card>
    );
  }

  // 2. No identity yet
  if (!hasIdentity) {
    return (
      <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-4">
        <h3 className="text-sm font-bold tracking-tight uppercase">Create ZK Identity</h3>
        <p className="text-xs text-zinc-500">Sign a message to derive your anonymous voter identity.</p>
        <Button
          onClick={() => createIdentity().catch(e => setError(e.message))}
          disabled={isCreating}
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold tracking-widest uppercase"
        >
          {isCreating ? <><Loader2 size={14} className="animate-spin mr-2" /> Signing...</> : 'Create Identity'}
        </Button>
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </Card>
    );
  }

  // 3. Not registered on-chain
  if (!isRegistered) {
    return (
      <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-4">
        <h3 className="text-sm font-bold tracking-tight uppercase">Register as Voter</h3>
        <p className="text-xs text-zinc-500">Register your identity on-chain to join the voter group. One-time transaction.</p>
        <p className="text-[10px] font-mono text-zinc-600 break-all">Commitment: {commitment?.slice(0, 20)}...</p>
        <Button
          onClick={() => { if (identity) register(identity.commitment); }}
          disabled={isRegistering}
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold tracking-widest uppercase"
        >
          {isRegistering ? <><Loader2 size={14} className="animate-spin mr-2" /> Registering...</> : 'Register On-Chain'}
        </Button>
        {regHash && (
          <a href={`${EXPLORER_URL}/tx/${regHash}`} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-indigo-400 flex items-center gap-1 hover:underline">
            View transaction <ExternalLink size={10} />
          </a>
        )}
        {regSuccess && <p className="text-xs text-emerald-400"><CheckCircle2 size={12} className="inline mr-1" />Registered! You can now vote.</p>}
        {regError && <p className="text-xs text-rose-400 break-all">{(regError as any)?.shortMessage || (regError as any)?.message || 'Registration failed'}</p>}
      </Card>
    );
  }

  // 4. Already voted
  if (hasVoted) {
    return (
      <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-4 text-center">
        <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
        <h3 className="text-sm font-bold tracking-tight uppercase">Vote Recorded</h3>
        <p className="text-xs text-zinc-500">You have already voted on this proposal. Your vote is anonymous and verified by a zero-knowledge proof.</p>
      </Card>
    );
  }

  // 5. Vote success
  if (voteSuccess) {
    return (
      <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-4 text-center">
        <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
        <h3 className="text-sm font-bold tracking-tight uppercase">Vote Cast</h3>
        <p className="text-xs text-zinc-500">Your anonymous vote has been verified on-chain via ZK proof.</p>
        {voteHash && (
          <a href={`${EXPLORER_URL}/tx/${voteHash}`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-indigo-400 flex items-center gap-1 justify-center hover:underline">
            View on Explorer <ExternalLink size={12} />
          </a>
        )}
      </Card>
    );
  }

  // 5. Ready to vote
  const handleVote = async (choice: 0 | 1 | 2) => {
    if (!identity) return;
    setError(null);
    setProofState('generating');

    try {
      // Fetch group members from on-chain events
      const semaphoreData = new SemaphoreEthers(HASHKEY_TESTNET.rpcUrl, {
        address: SEMAPHORE_ADDRESS,
        startBlock: DEPLOYMENT_BLOCK,
      });

      const members = await semaphoreData.getGroupMembers('0');
      const group = new Group(members.map(BigInt));

      // Generate ZK proof in browser
      const proof = await generateProof(identity, group, choice, proposal.id);

      setProofState('idle');

      // Submit to contract — user signs this transaction
      vote(
        proposal.id,
        proof.merkleTreeDepth,
        BigInt(proof.merkleTreeRoot),
        BigInt(proof.nullifier),
        BigInt(proof.message),
        proof.points.map(BigInt)
      );

      onVoteSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to generate proof');
      setProofState('idle');
    }
  };

  return (
    <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-6">
      <div className="flex items-center gap-2 text-indigo-400">
        <Shield size={16} />
        <h3 className="text-xs font-bold tracking-widest uppercase">Private Ballot</h3>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        A ZK proof will verify your membership without revealing your identity. You sign the transaction directly.
      </p>

      <div className="flex flex-col gap-3">
        <Button onClick={() => handleVote(1)} disabled={proofState !== 'idle' || isVoting || isConfirming}
          variant="outline" className="w-full h-12 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-[11px] font-bold tracking-widest uppercase">
          {(proofState === 'generating' || isVoting || isConfirming) ? <Loader2 size={14} className="animate-spin mr-2" /> : null} For
        </Button>
        <Button onClick={() => handleVote(0)} disabled={proofState !== 'idle' || isVoting || isConfirming}
          variant="outline" className="w-full h-12 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-[11px] font-bold tracking-widest uppercase">
          Against
        </Button>
        <Button onClick={() => handleVote(2)} disabled={proofState !== 'idle' || isVoting || isConfirming}
          variant="outline" className="w-full h-12 border-zinc-500/30 text-zinc-400 hover:bg-zinc-500/10 text-[11px] font-bold tracking-widest uppercase">
          Abstain
        </Button>
      </div>

      {proofState === 'generating' && <p className="text-[10px] text-indigo-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Generating ZK proof...</p>}
      {isVoting && <p className="text-[10px] text-indigo-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Sign the transaction in your wallet...</p>}
      {isConfirming && <p className="text-[10px] text-indigo-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Confirming on-chain...</p>}
      {(error || voteError) && <p className="text-[10px] text-rose-400 flex items-center gap-2"><AlertCircle size={12} /> {error || (voteError as any)?.message}</p>}
    </Card>
  );
}
