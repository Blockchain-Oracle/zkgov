'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ZK_VOTING_ADDRESS, ZK_VOTING_ABI } from '@/lib/contracts';
import type { Proposal } from '@zkgov/shared';

/**
 * Read the voter registration status for an address.
 */
export function useIsVoter(address: `0x${string}` | undefined) {
  return useReadContract({
    address: ZK_VOTING_ADDRESS,
    abi: ZK_VOTING_ABI,
    functionName: 'isVoter',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

/**
 * Read platform stats from the contract.
 */
export function useContractStats() {
  return useReadContract({
    address: ZK_VOTING_ADDRESS,
    abi: ZK_VOTING_ABI,
    functionName: 'getStats',
  });
}

/**
 * Read proposal count.
 */
export function useProposalCount() {
  return useReadContract({
    address: ZK_VOTING_ADDRESS,
    abi: ZK_VOTING_ABI,
    functionName: 'proposalCount',
  });
}

/**
 * Read a single proposal's content + state.
 */
export function useProposalData(id: number) {
  const content = useReadContract({
    address: ZK_VOTING_ADDRESS,
    abi: ZK_VOTING_ABI,
    functionName: 'getProposalContent',
    args: [BigInt(id)],
    query: { enabled: id > 0 },
  });

  const state = useReadContract({
    address: ZK_VOTING_ADDRESS,
    abi: ZK_VOTING_ABI,
    functionName: 'getProposalState',
    args: [BigInt(id)],
    query: { enabled: id > 0 },
  });

  const proposal: Proposal | null = content.data && state.data ? {
    id,
    title: (content.data as any)[0],
    description: (content.data as any)[1],
    creator: (content.data as any)[2],
    votingStart: Number((state.data as any)[0]) * 1000,
    votingEnd: Number((state.data as any)[1]) * 1000,
    quorum: Number((state.data as any)[2]),
    votesFor: Number((state.data as any)[3]),
    votesAgainst: Number((state.data as any)[4]),
    votesAbstain: Number((state.data as any)[5]),
    totalVotes: Number((state.data as any)[6]),
    finalized: (state.data as any)[7],
    passed: (state.data as any)[8],
    isActive: (state.data as any)[9],
  } : null;

  return {
    proposal,
    isLoading: content.isLoading || state.isLoading,
    error: content.error || state.error,
    refetch: () => { content.refetch(); state.refetch(); },
  };
}

/**
 * Write: Register as a voter.
 */
export function useRegister() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const register = (commitment: bigint) => {
    writeContract({
      address: ZK_VOTING_ADDRESS,
      abi: ZK_VOTING_ABI,
      functionName: 'register',
      args: [commitment],
    });
  };

  return { register, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Write: Create a proposal.
 */
export function useCreateProposalTx() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const create = (title: string, description: string, votingPeriod: number, quorum: number) => {
    writeContract({
      address: ZK_VOTING_ADDRESS,
      abi: ZK_VOTING_ABI,
      functionName: 'createProposal',
      args: [title, description, BigInt(votingPeriod), BigInt(quorum)],
    });
  };

  return { create, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Write: Cast a vote with ZK proof.
 */
export function useCastVoteTx() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const vote = (
    proposalId: number,
    merkleTreeDepth: number,
    merkleTreeRoot: bigint,
    nullifier: bigint,
    choice: bigint,
    points: readonly bigint[]
  ) => {
    writeContract({
      address: ZK_VOTING_ADDRESS,
      abi: ZK_VOTING_ABI,
      functionName: 'castVote',
      args: [
        BigInt(proposalId),
        BigInt(merkleTreeDepth),
        merkleTreeRoot,
        nullifier,
        choice,
        points as unknown as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
      ],
    });
  };

  return { vote, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Write: Finalize a proposal.
 */
export function useFinalizeTx() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const finalize = (proposalId: number) => {
    writeContract({
      address: ZK_VOTING_ADDRESS,
      abi: ZK_VOTING_ABI,
      functionName: 'finalizeProposal',
      args: [BigInt(proposalId)],
    });
  };

  return { finalize, hash, isPending, isConfirming, isSuccess, error };
}
