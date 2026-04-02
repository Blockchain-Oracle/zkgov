'use client';

import { use } from 'react';
import { useProposal } from '@/hooks/useProposal';
import { VoteSection } from '@/components/governance/VoteSection';
import { DiscussionSection } from '@/components/governance/DiscussionSection';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, Calendar, User, BarChart3, MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: proposal, isLoading, error } = useProposal(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="h-4 w-24 bg-white/5 rounded"></div>
        <div className="flex flex-col gap-4">
          <div className="h-10 w-2/3 bg-white/5 rounded"></div>
          <div className="h-4 w-1/3 bg-white/5 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2 h-96 bg-white/5 rounded"></div>
          <div className="h-64 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-500">Proposal Not Found</h2>
        <Link href="/proposals" className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
          ← Back to Proposals
        </Link>
      </div>
    );
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'active': return 'text-indigo-400 border-indigo-400/20 bg-indigo-400/5';
      case 'succeeded': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
      case 'defeated': return 'text-rose-400 border-rose-400/20 bg-rose-400/5';
      default: return 'text-zinc-500 border-zinc-500/20 bg-zinc-500/5';
    }
  };

  const calculateWidth = (count: number) => {
    if (proposal.totalVotes === 0) return '0%';
    return `${(count / proposal.totalVotes) * 100}%`;
  };

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Navigation & Status */}
      <div className="flex items-center justify-between">
        <Link 
          href="/proposals" 
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] font-bold tracking-widest uppercase"
        >
          <ChevronLeft size={14} />
          Back to Proposals
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            {proposal.voterGroup.toUpperCase()} VOTING
          </span>
          <Badge className={cn("rounded-sm px-3 py-1 text-[10px] font-bold uppercase tracking-widest border", getStatusColor(proposal.status))}>
            {proposal.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Left Content: Proposal Details */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1]">
              {proposal.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              <div className="flex items-center gap-2">
                <User size={14} className="text-indigo-400/60" />
                BY <span className="text-zinc-300">ANONYMOUS {proposal.creator.type.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-indigo-400/60" />
                CREATED <span className="text-zinc-300">{new Date(proposal.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-indigo-400/60" />
                ID <span className="text-zinc-300">#{String(proposal.id).padStart(3, '0')}</span>
              </div>
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          <div className="prose prose-invert max-w-none text-zinc-400 leading-relaxed font-mono text-sm">
            <ReactMarkdown
              components={{
                h1: ({...props}) => <h1 className="text-white font-bold text-xl mt-8 mb-4 uppercase tracking-tight" {...props} />,
                h2: ({...props}) => <h2 className="text-white font-bold text-lg mt-8 mb-4 uppercase tracking-tight" {...props} />,
                p: ({...props}) => <p className="mb-4" {...props} />,
                ul: ({...props}) => <ul className="list-disc pl-4 mb-4 space-y-2" {...props} />,
                li: ({...props}) => <li {...props} />,
                code: ({...props}) => <code className="bg-white/5 px-1.5 py-0.5 rounded text-indigo-300" {...props} />,
              }}
            >
              {proposal.description}
            </ReactMarkdown>
          </div>
        </div>

        {/* Right Sidebar: Voting & Stats */}
        <aside className="flex flex-col gap-8 sticky top-24">
          <VoteSection proposal={proposal} />

          {/* Detailed Results Card */}
          <div className="bg-[#111] border border-white/[0.06] rounded-sm p-6 flex flex-col gap-6">
            <h3 className="text-xs font-bold tracking-widest uppercase text-white">Live Results</h3>
            
            <div className="flex flex-col gap-4">
              {[
                { label: 'FOR', count: proposal.votes.for, color: 'bg-emerald-500', text: 'text-emerald-400' },
                { label: 'AGAINST', count: proposal.votes.against, countVal: proposal.votes.against, color: 'bg-rose-500', text: 'text-rose-400' },
                { label: 'ABSTAIN', count: proposal.votes.abstain, color: 'bg-zinc-400', text: 'text-zinc-400' },
              ].map((res) => (
                <div key={res.label} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] font-bold tracking-widest">
                    <span className={res.text}>{res.label}</span>
                    <span className="text-zinc-500 font-mono">{res.count} ({calculateWidth(res.count)})</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000 ease-out", res.color)}
                      style={{ width: calculateWidth(res.count) }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Separator className="bg-white/[0.04]" />

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest">
                <span className="text-zinc-500 uppercase">QUORUM PROGRESS</span>
                <span className={cn(
                  "font-mono",
                  proposal.totalVotes >= proposal.quorum ? "text-emerald-400" : "text-amber-400"
                )}>
                  {proposal.totalVotes} / {proposal.quorum}
                </span>
              </div>
              <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-1000",
                    proposal.totalVotes >= proposal.quorum ? "bg-emerald-500" : "bg-amber-400"
                  )}
                  style={{ width: `${Math.min(100, (proposal.totalVotes / proposal.quorum) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                  <Clock size={10} />
                  Ends In
                </span>
                <span className="text-[11px] font-medium text-zinc-400">{proposal.timeRemaining || 'Ended'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                  <MessageSquare size={10} />
                  Total Comments
                </span>
                <span className="text-[11px] font-medium text-zinc-400">{proposal.commentCount}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Separator className="bg-white/[0.06] my-12" />
      <div className="max-w-[1400px] w-full">
        <DiscussionSection proposalId={proposal.id} />
      </div>
    </div>
  );
}
