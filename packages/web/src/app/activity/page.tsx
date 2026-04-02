'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  MessageSquare, 
  PlusCircle, 
  CheckCircle2, 
  Globe, 
  Send, 
  MessageSquare as DiscordIcon, 
  Cpu 
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'vote' | 'proposal' | 'comment' | 'tally';
  platform: 'web' | 'telegram' | 'discord' | 'api';
  text: string;
  time: string;
  proposalId?: number;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [autoUpdate, setAutoUpdate] = useState(true);

  // Initial mock data for the "frames" feel until SSE/API is fully connected
  useEffect(() => {
    const initialData: ActivityItem[] = [
      { id: '1', type: 'vote', platform: 'telegram', text: 'Anonymous vote cast on #007', time: 'JUST NOW', proposalId: 7 },
      { id: '2', type: 'comment', platform: 'api', text: 'TreasuryAnalyzer posted analysis on #007', time: '4M AGO', proposalId: 7 },
      { id: '3', type: 'vote', platform: 'web', text: 'Anonymous vote cast on #007', time: '12M AGO', proposalId: 7 },
      { id: '4', type: 'proposal', platform: 'web', text: 'Proposal #007 created: Allocate 10% to dev grants', time: '2H AGO', proposalId: 7 },
      { id: '5', type: 'tally', platform: 'api', text: 'Proposal #006 tallied: SUCCEEDED', time: '1D AGO', proposalId: 6 },
      { id: '6', type: 'vote', platform: 'discord', text: 'Anonymous vote cast on #006', time: '1D AGO', proposalId: 6 },
    ];
    setActivities(initialData);

    // Setup SSE for real-time global feed
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
      case 'discord': return <DiscordIcon size={14} className="text-[#5865F2]" />;
      case 'api': return <Cpu size={14} className="text-amber-400" />;
      default: return <Globe size={14} className="text-indigo-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vote': return <CheckCircle2 size={16} />;
      case 'proposal': return <PlusCircle size={16} />;
      case 'comment': return <MessageSquare size={16} />;
      case 'tally': return <BarChart3 size={16} />;
      default: return <Globe size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vote': return 'bg-emerald-500/10 text-emerald-400';
      case 'proposal': return 'bg-indigo-500/10 text-indigo-400';
      case 'comment': return 'bg-amber-500/10 text-amber-400';
      case 'tally': return 'bg-purple-500/10 text-purple-400';
      default: return 'bg-zinc-500/10 text-zinc-400';
    }
  };

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
              <button 
                onClick={() => setAutoUpdate(!autoUpdate)}
                className="text-[10px] font-bold tracking-[0.1em] text-zinc-400 hover:text-zinc-900 dark:hover:text-white uppercase transition-colors"
              >
                AUTO UPDATE {autoUpdate ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm p-1">
          {['ALL ACTIVITY', 'VOTES', 'PROPOSALS', 'COMMENTS'].map((f) => (
            <button
              key={f}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold tracking-[0.15em] rounded-sm transition-all uppercase whitespace-nowrap",
                f === 'ALL ACTIVITY' ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col border border-black/[0.06] dark:border-white/[0.06] rounded-sm overflow-hidden bg-[#EBE8E1] dark:bg-[#0c0c0c]">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.06] bg-[#EBE8E1] dark:bg-[#111]">
          <div className="col-span-1 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">TYPE</div>
          <div className="col-span-7 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">EVENT</div>
          <div className="col-span-2 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">PLATFORM</div>
          <div className="col-span-2 text-[10px] font-bold tracking-widest text-zinc-600 uppercase text-right">TIME</div>
        </div>

        {/* Activity Rows */}
        <div className="flex flex-col">
          {activities.map((activity, idx) => (
            <div 
              key={activity.id} 
              className={cn(
                "grid grid-cols-12 gap-4 px-6 py-5 border-b border-black/[0.04] dark:border-white/[0.04] items-center hover:bg-white/[0.02] transition-colors cursor-pointer animate-in group",
                idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
              )}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="col-span-1">
                <div className={cn("w-9 h-9 rounded-sm flex items-center justify-center", getTypeColor(activity.type))}>
                  {getTypeIcon(activity.type)}
                </div>
              </div>
              
              <div className="col-span-7 flex flex-col gap-1">
                <p className="text-sm font-medium tracking-tight text-zinc-300 leading-none">
                  {activity.text.split(' ').map((word, i) => {
                    if (word.startsWith('#')) return <span key={i} className="text-white font-bold">{word} </span>;
                    if (activity.text.includes('POSTED') && i === 0) return <span key={i} className="text-indigo-400 font-bold">{word} </span>;
                    return word + ' ';
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">TRANSACTION</span>
                  <span className="text-[10px] font-mono text-zinc-500 group-hover:text-indigo-400 transition-colors">0x7d21...f3a9</span>
                </div>
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

        {/* Pagination (Frames style) */}
        <div className="flex items-center justify-between px-6 py-6 bg-[#EBE8E1] dark:bg-[#111]">
          <span className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase">
            PAGE 1 OF 482
          </span>
          <div className="flex items-center gap-1">
            <button className="px-4 py-2 border border-black/[0.06] dark:border-white/[0.06] text-[10px] font-bold tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase disabled:opacity-30">
              PREVIOUS
            </button>
            <div className="flex items-center px-4">
              <span className="text-[10px] font-bold tracking-widest text-zinc-900 dark:text-white">1</span>
            </div>
            <button className="px-4 py-2 border border-black/[0.06] dark:border-white/[0.06] text-[10px] font-bold tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase">
              NEXT
            </button>
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
