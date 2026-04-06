/**
 * React Query hooks for proposals
 *
 * Benefits over raw useEffect+fetch:
 * - Automatic caching (navigating back doesn't refetch)
 * - Background refetching (data stays fresh)
 * - Deduplication (two components using same query = one request)
 * - Loading/error states for free
 * - Mutation invalidation (voting invalidates proposal cache)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProposals, fetchProposal, createProposal, castVote } from '@/lib/api';

export function useProposals(status?: string, page = 1) {
  return useQuery({
    queryKey: ['proposals', status, page],
    queryFn: () => fetchProposals({ status, page }),
    staleTime: 30_000, // consider fresh for 30s
  });
}

export function useProposalDetail(id: string | number) {
  return useQuery({
    queryKey: ['proposal', String(id)],
    queryFn: () => fetchProposal(id),
    enabled: !!id,
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });
}

export function useVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, choice }: { proposalId: number; choice: 0 | 1 | 2 }) =>
      castVote(proposalId, choice),
    onSuccess: (_, { proposalId }) => {
      // Invalidate both the list and the specific proposal
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal', String(proposalId)] });
    },
  });
}
