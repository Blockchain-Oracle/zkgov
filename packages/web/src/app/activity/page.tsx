'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/constants';
import { fetchActivity } from '@/lib/api';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  MessageSquare,
  PlusCircle,
  CheckCircle2,
  Globe,
  Send,
  Cpu,
  UserPlus,
  ExternalLink,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'vote' | 'proposal' | 'comment' | 'registration' | 'tally';
  platform: 'web' | 'on-chain' | 'telegram' | 'api';
  text: string;
  time: string;
  proposalId?: number;
  txHash?: string | null;
  explorerUrl?: string | null;
}

const PAGE_SIZE = 10;

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL ACTIVITY');
  const [page, setPage] = useState(1);

  // Load historical activity on mount
  useEffect(() => {
    fetchActivity()
      .then(data => {
        setActivities(data.activity.map((a: any) => ({
          id: a.id,
          type: a.type as ActivityItem['type'],
          platform: a.platform as ActivityItem['platform'],
          text: a.text,
          proposalId: a.proposalId,
          txHash: a.txHash || null,
          explorerUrl: a.explorerUrl || null,
          time: formatRelativeTime(a.time),
        })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Setup SSE for real-time updates on top of historical data
    const eventSource = new EventSource(`${API_URL}/api/sse/feed`);
    
    eventSource.addEventListener('vote_cast', (event) => {
      if (!autoUpdate) return;
      const data = JSON.parse(event.data);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: 'vote',
        platform: data.submittedVia || 'web',
        text: `Anonymous vote cast on #${String(data.proposalId).padStart(3, '0')}`,
        time: 'JUST NOW',
        proposalId: data.proposalId,
      }, ...prev]);
    });

    eventSource.addEventListener('new_proposal', (event) => {
      if (!autoUpdate) return;
      const data = JSON.parse(event.data);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: 'proposal',
        platform: 'web',
        text: `Proposal #${String(data.id).padStart(3, '0')} created: "${data.title}"`,
        time: 'JUST NOW',
        proposalId: data.id,
      }, ...prev]);
    });

    eventSource.addEventListener('comment_added', (event) => {
      if (!autoUpdate) return;
      const data = JSON.parse(event.data);
      setActivities(prev => [{
        id: Date.now().toString(),
        type: 'comment',
        platform: 'api',
        text: `Comment posted on #${String(data.proposalId).padStart(3, '0')}`,
        time: 'JUST NOW',
        proposalId: data.proposalId,
      }, ...prev]);
    });

    return () => eventSource.close();
  }, [autoUpdate]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'telegram': return <Send size={14} className="text-[#24A1DE]" />;
      case 'on-chain': return <Globe size={14} className="text-emerald-400" />;
      case 'api': return <Cpu size={14} className="text-amber-400" />;
      default: return <Globe size={14} className="text-indigo-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vote': return <CheckCircle2 size={16} />;
      case 'proposal': return <PlusCircle size={16} />;
      case 'comment': return <MessageSquare size={16} />;
      case 'registration': return <UserPlus size={16} />;
      case 'tally': return <BarChart3 size={16} />;
      default: return <Globe size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vote': return 'bg-emerald-500/10 text-emerald-400';
      case 'proposal': return 'bg-indigo-500/10 text-indigo-400';
      case 'comment': return 'bg-amber-500/10 text-amber-400';
      case 'registration': return 'bg-cyan-500/10 text-cyan-400';
      case 'tally': return 'bg-purple-500/10 text-purple-400';
      default: return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [typeFilter]);

  const filtered = activities.filter(a => {
    if (typeFilter === 'ALL ACTIVITY') return true;
    if (typeFilter === 'VOTES') return a.type === 'vote';
    if (typeFilter === 'PROPOSALS') return a.type === 'proposal';
    if (typeFilter === 'REGISTRATIONS') return a.type === 'registration';
    if (typeFilter === 'COMMENTS') return a.type === 'comment';
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedActivities = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight uppercase">Global Activity</h1>
          <div className="flex items-center gap-4">
            <p className="text-zinc-500 text-sm">
              Real-time audit log of the ZK governance layer.
            </p>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                autoUpdate ? "bg-emerald-500" : "bg-zinc-600"
              )}></div>
              <Button
                variant="ghost"
                onClick={() => setAutoUpdate(!autoUpdate)}
                className="text-[10px] font-bold tracking-[0.1em] text-zinc-400 hover:text-zinc-900 dark:hover:text-white uppercase transition-colors"
              >
                AUTO UPDATE {autoUpdate ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm p-1">
          {['ALL ACTIVITY', 'VOTES', 'PROPOSALS', 'REGISTRATIONS', 'COMMENTS'].map((f) => (
            <Button
              key={f}
              variant="ghost"
              onClick={() => setTypeFilter(f)}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold tracking-[0.15em] rounded-sm transition-all uppercase whitespace-nowrap",
                typeFilter === f ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              )}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col border border-black/[0.06] dark:border-white/[0.06] rounded-sm overflow-hidden bg-[#EBE8E1] dark:bg-[#0c0c0c]">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.06] bg-[#EBE8E1] dark:bg-[#111]">
          <div className="col-span-1 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">TYPE</div>
          <div className="col-span-5 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">EVENT</div>
          <div className="col-span-2 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">TX HASH</div>
          <div className="col-span-2 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">PLATFORM</div>
          <div className="col-span-2 text-[10px] font-bold tracking-widest text-zinc-600 uppercase text-right">TIME</div>
        </div>

        {/* Activity Rows */}
        <div className="flex flex-col">
          {pagedActivities.map((activity, idx) => (
            <div
              key={activity.id}
              className={cn(
                "grid grid-cols-12 gap-4 px-6 py-5 border-b border-black/[0.04] dark:border-white/[0.04] items-center animate-in",
                idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
              )}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="col-span-1">
                <div className={cn("w-9 h-9 rounded-sm flex items-center justify-center", getTypeColor(activity.type))}>
                  {getTypeIcon(activity.type)}
                </div>
              </div>

              <div className="col-span-5 flex flex-col gap-1">
                {activity.proposalId ? (
                  <Link href={`/proposals/${activity.proposalId}`} className="hover:underline">
                    <p className="text-sm font-medium tracking-tight text-zinc-800 dark:text-zinc-300 leading-none">
                      {activity.text}
                    </p>
                  </Link>
                ) : (
                  <p className="text-sm font-medium tracking-tight text-zinc-800 dark:text-zinc-300 leading-none">
                    {activity.text}
                  </p>
                )}
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-widest w-fit",
                  getTypeColor(activity.type).split(' ')[1]
                )}>
                  {activity.type}
                </span>
              </div>

              <div className="col-span-2">
                {activity.txHash && activity.explorerUrl ? (
                  <a
                    href={activity.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    {activity.txHash.slice(0, 6)}...{activity.txHash.slice(-4)}
                    <ExternalLink size={10} />
                  </a>
                ) : (
                  <span className="text-[10px] text-zinc-600">—</span>
                )}
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white/[0.04] rounded-sm">
                    {getPlatformIcon(activity.platform)}
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                    {activity.platform}
                  </span>
                </div>
              </div>

              <div className="col-span-2 text-right">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight">
                  {activity.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-6 bg-[#EBE8E1] dark:bg-[#111]">
          <span className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase">
            {filtered.length} EVENTS
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" disabled={currentPage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 border border-black/[0.06] dark:border-white/[0.06] text-[10px] font-bold tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase disabled:opacity-30">
              PREVIOUS
            </Button>
            <div className="flex items-center px-4">
              <span className="text-[10px] font-bold tracking-widest text-zinc-900 dark:text-white">{currentPage} / {totalPages}</span>
            </div>
            <Button variant="outline" disabled={currentPage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-4 py-2 border border-black/[0.06] dark:border-white/[0.06] text-[10px] font-bold tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase disabled:opacity-30">
              NEXT
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-8 border border-black/[0.06] dark:border-white/[0.06] rounded-sm bg-[#EBE8E1] dark:bg-[#111] animate-in delay-2">
        <h3 className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase">Audit Principle</h3>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl font-mono">
          All actions in the ZKGov layer are verified on-chain. While identity is private, the mathematical proof of eligibility and the result of every vote is public and immutable. 
          This transparency ensures the integrity of the agent era.
        </p>
      </div>
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}M AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
}
