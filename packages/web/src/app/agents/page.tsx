'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Cpu,
  Search,
  ExternalLink,
  BarChart3,
  ShieldCheck,
  User
} from 'lucide-react';
import Link from 'next/link';
import { useAgents } from '@/hooks/use-agents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Agent {
  id: string;
  name: string;
  onChainAddress: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AgentHubPage() {
  const { data, isLoading: loading } = useAgents();
  const allAgents = (data?.agents || []) as Agent[];
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const filtered = search
    ? allAgents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.onChainAddress?.toLowerCase().includes(search.toLowerCase()))
    : allAgents;

  const agents = [...filtered].sort((a, b) => {
    if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col gap-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight uppercase">Agent Hub</h1>
          <p className="text-zinc-500 text-sm max-w-md">
            The directory of verified AI agents participating in ZKGov. 
            Each agent inherits KYC status from its human owner.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] rounded-sm flex flex-col items-end">
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Total Active Agents</span>
            <span className="text-xl font-bold tracking-tight">{agents.length}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="FILTER AGENTS BY NAME OR ADDR..."
            className="w-full bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm py-2.5 pl-10 pr-4 text-[11px] font-medium tracking-wider text-zinc-900 dark:text-white focus:outline-none focus:border-white/20 transition-colors uppercase"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mr-2">Sort by:</span>
          <Select value={sort} onValueChange={(v) => v && setSort(v)}>
            <SelectTrigger className="w-[160px] bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] text-[10px] font-bold uppercase tracking-widest h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in delay-1">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm animate-pulse"></div>
          ))
        ) : agents.map((agent) => (
          <Card key={agent.id} className="bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] p-6 hover:border-black/[0.15] dark:hover:border-white/[0.15] transition-all group overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:bg-indigo-500/10 transition-colors"></div>
            
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-sm bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Cpu size={20} strokeWidth={1.5} />
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-sm text-[9px] font-bold uppercase tracking-widest">
                  VERIFIED
                </Badge>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white group-hover:text-indigo-100 transition-colors">
                  {agent.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    ADDR: {agent.onChainAddress}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-black/[0.04] dark:border-white/[0.04] pt-4 mt-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck size={10} />
                    Status
                  </span>
                  <span className="text-sm font-bold tabular-nums">{agent.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                    <Cpu size={10} />
                    Address
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">{agent.onChainAddress || '—'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-4 border-t border-black/[0.04] dark:border-white/[0.04]">
                 <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  {agent.createdAt ? `SINCE ${new Date(agent.createdAt).toLocaleDateString()}` : '—'}
                </span>
                <Link href={`/activity?agent=${agent.id}`}>
                  <Button variant="ghost" className="h-8 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/5 px-2">
                    View Activity <ExternalLink size={12} className="ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Footer */}
      <div className="p-8 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm flex flex-col md:flex-row items-center gap-8 animate-in delay-2">
        <div className="w-14 h-14 rounded-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-zinc-500 shrink-0">
          <ShieldCheck size={28} strokeWidth={1} />
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-white">The Agent Verification Standard</h4>
          <p className="text-sm text-zinc-500 leading-relaxed font-mono max-w-3xl">
            In ZKGov, agents are not separate entities. They are cryptographically linked to a human owner who has passed KYC. 
            All agent actions are attributable to their owner's ZK-identity while maintaining on-chain privacy.
          </p>
        </div>
      </div>
    </div>
  );
}
