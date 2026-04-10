import Link from 'next/link';
import { cn } from '@/lib/utils';


interface ProposalCardProps {
  proposal: any;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const { 
    id, 
    title, 
    status, 
    votes, 
    totalVotes, 
    quorum, 
    timeRemaining, 
    commentCount
  } = proposal;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'active': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      case 'succeeded': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'defeated': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const calculateWidth = (count: number) => {
    if (totalVotes === 0) return '0%';
    return `${(count / totalVotes) * 100}%`;
  };

  return (
    <Link 
      href={`/proposals/${id}`}
      className="block group relative bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm p-6 card-hover overflow-hidden"
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative z-10 flex flex-col gap-6">
        {/* Header: ID + Status */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-medium text-zinc-500 tracking-widest uppercase">
            ID: #{String(id).padStart(3, '0')}
          </span>
          <span className={cn("badge border", getStatusColor(status))}>
            {status}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
          {title}
        </h3>

        {/* Vote Distribution Bars (Frames Pattern) */}
        <div className="flex flex-col gap-3">
          {/* For */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-emerald-400 w-12 uppercase tracking-tighter">FOR</span>
            <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out" 
                style={{ width: calculateWidth(votes.for) }}
              ></div>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 w-6 text-right">{votes.for}</span>
          </div>

          {/* Against */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-rose-400 w-12 uppercase tracking-tighter">AGAINST</span>
            <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all duration-700 ease-out" 
                style={{ width: calculateWidth(votes.against) }}
              ></div>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 w-6 text-right">{votes.against}</span>
          </div>

          {/* Abstain */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400 w-12 uppercase tracking-tighter">ABSTAIN</span>
            <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-400 rounded-full transition-all duration-700 ease-out" 
                style={{ width: calculateWidth(votes.abstain) }}
              ></div>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 w-6 text-right">{votes.abstain}</span>
          </div>
        </div>

        {/* Footer: Metadata (Frames Pattern) */}
        <div className="flex items-center gap-6 border-t border-black/[0.04] dark:border-white/[0.04] pt-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Time Remaining</span>
            <span className="text-[11px] font-medium text-zinc-400">{timeRemaining || 'Ended'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Quorum</span>
            <span className={cn(
              "text-[11px] font-medium",
              totalVotes >= quorum ? "text-emerald-400" : "text-amber-400"
            )}>
              {totalVotes}/{quorum}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 ml-auto text-right">
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Comments</span>
            <span className="text-[11px] font-medium text-zinc-400">{commentCount}</span>
          </div>
        </div>

        {/* Voter Group Requirement Badge */}
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-bold text-indigo-400/50 uppercase tracking-[0.2em] [writing-mode:vertical-lr]">
          </span>
        </div>
      </div>
    </Link>
  );
}
