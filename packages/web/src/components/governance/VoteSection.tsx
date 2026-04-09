'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Group, generateProof } from '@semaphore-protocol/core';
import { SemaphoreEthers } from '@semaphore-protocol/data';
import { useAuth } from '@/hooks/useAuth';
import { useSemaphoreIdentity } from '@/hooks/useSemaphoreIdentity';
import { useIsVoter, useRegister, useCastVoteTx } from '@/hooks/useZKVoting';
import { EXPLORER_URL, SEMAPHORE_ADDRESS } from '@/lib/contracts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

  const isRegistered = !!(voterData as any)?.[0];

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

  // 4. Vote success
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
