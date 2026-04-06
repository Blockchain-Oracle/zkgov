import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAgents, fetchMyAgents, registerAgent, deleteAgent } from '@/lib/api';

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    staleTime: 60_000,
  });
}

export function useMyAgents() {
  return useQuery({
    queryKey: ['agents', 'mine'],
    queryFn: fetchMyAgents,
    staleTime: 30_000,
  });
}

export function useRegisterAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, onChainAddress }: { name: string; onChainAddress?: string }) =>
      registerAgent(name, onChainAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}
