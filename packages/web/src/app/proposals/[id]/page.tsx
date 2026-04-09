'use client';

import { use } from 'react';
import { useProposalData } from '@/hooks/useZKVoting';
import { VoteSection } from '@/components/governance/VoteSection';
import { DiscussionSection } from '@/components/governance/DiscussionSection';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, BarChart3, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const proposalId = parseInt(id);
  const { proposal, isLoading, refetch } = useProposalData(proposalId);

  if (isLoading || !proposal) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const status = proposal.finalized
    ? proposal.passed ? 'succeeded' : 'defeated'
    : proposal.isActive ? 'active' : 'ended';

  const timeRemaining = proposal.votingEnd > Date.now()
    ? formatDuration(proposal.votingEnd - Date.now())
    : null;

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link href="/proposals" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-[10px] font-bold tracking-widest uppercase">
          <ChevronLeft size={14} /> Back to Proposals
        </Link>
        <div className="flex items-center gap-3">
          <Badge className={cn(
            "text-[9px] font-bold uppercase tracking-widest rounded-sm px-2 py-0.5",
            status === 'active' && "bg-indigo-500/15 text-indigo-400",
            status === 'succeeded' && "bg-emerald-500/15 text-emerald-400",
            status === 'defeated' && "bg-rose-500/15 text-rose-400",
          )}>{status}</Badge>
          <span className="text-[10px] font-mono text-zinc-500">#{String(proposal.id).padStart(3, '0')}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{proposal.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-400 font-mono text-sm leading-relaxed">
            <ReactMarkdown>{proposal.description}</ReactMarkdown>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { label: 'For', count: proposal.votesFor, color: 'bg-emerald-500' },
              { label: 'Against', count: proposal.votesAgainst, color: 'bg-rose-500' },
              { label: 'Abstain', count: proposal.votesAbstain, color: 'bg-indigo-500' },
            ].map(v => (
              <div key={v.label} className="flex items-center gap-3">
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 w-16 uppercase">{v.label}</span>
                <div className="flex-1 h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", v.color)}
                    style={{ width: proposal.totalVotes > 0 ? `${(v.count / proposal.totalVotes) * 100}%` : '0%' }} />
                </div>
                <span className="text-[11px] font-mono text-zinc-500 w-8 text-right">{v.count}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-6 text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
            <span className="flex items-center gap-1"><Clock size={12} /> {timeRemaining || 'Ended'}</span>
            <span className="flex items-center gap-1"><BarChart3 size={12} /> Quorum: {proposal.totalVotes}/{proposal.quorum}</span>
          </div>

          <Separator className="bg-black/[0.06] dark:bg-white/[0.06]" />
          <DiscussionSection proposalId={proposal.id} />
        </div>

        <div>
          <VoteSection proposal={proposal} onVoteSuccess={refetch} />
        </div>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))}m`;
}
