'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';
import type { ProposalResponse } from '@zkgov/shared';

export function useProposal(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery<ProposalResponse>({
    queryKey: ['proposal', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/proposals/${id}`);
      if (!res.ok) throw new Error('Proposal not found');
      const data = await res.json();
      return data.proposal;
    },
  });

  // Listen for real-time updates via SSE
  useEffect(() => {
    if (!id) return;

    const eventSource = new EventSource(`${API_URL}/api/sse/proposals/${id}`);

    eventSource.addEventListener('vote_cast', (event) => {
      // Refresh proposal data when a vote is cast
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
    });

    eventSource.addEventListener('proposal_tallied', (event) => {
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
    });

    eventSource.addEventListener('comment_added', (event) => {
      // We'll have a separate comments query but this is a good signal
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
    });

    return () => {
      eventSource.close();
    };
  }, [id, queryClient]);

  return query;
}
