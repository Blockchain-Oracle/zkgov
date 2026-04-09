'use client';

import { useState, useEffect } from 'react';
import { ProposalCard } from '@/components/governance/ProposalCard';
import { fetchProposals } from '@/lib/api';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { Proposal } from '@zkgov/shared';

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProposals()
      .then(data => { setProposals(data.proposals || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = proposals
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight uppercase">Governance Proposals</h1>
          <p className="text-zinc-500 text-sm max-w-md">
            Cast your anonymous vote on protocol upgrades and treasury allocations.
          </p>
        </div>
        <Link href="/proposals/new">
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[11px] tracking-[0.1em] uppercase">
            <Plus size={14} className="mr-2" /> Create Proposal
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="w-full border-y border-black/[0.04] dark:border-white/[0.04] py-8 grid grid-cols-3 gap-12">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total</span>
          <span className="text-2xl font-bold tracking-tight">{proposals.length}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active</span>
          <span className="text-2xl font-bold tracking-tight">{proposals.filter(p => p.status === 'active').length}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Votes</span>
          <span className="text-2xl font-bold tracking-tight">{proposals.reduce((s: number, p: any) => s + (p.totalVotes || 0), 0)}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH PROPOSALS..."
            className="w-full bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06] rounded-sm py-2.5 pl-10 pr-4 text-[11px] font-medium tracking-wider" />
        </div>
        <div className="flex items-center gap-2 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm p-1">
          {['active', 'succeeded', 'defeated', 'all'].map((f) => (
            <Button key={f} variant="ghost" size="sm" onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-[10px] font-bold tracking-[0.15em] rounded-sm uppercase ${
                filter === f ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'text-zinc-500'
              }`}>
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Proposals grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-sm" />)
        ) : filtered.length > 0 ? (
          filtered.map((p) => <ProposalCard key={p.id} proposal={p} />)
        ) : (
          <div className="col-span-full h-64 border border-dashed border-black/[0.06] dark:border-white/[0.06] rounded-sm flex flex-col items-center justify-center gap-4">
            <span className="text-zinc-500 font-medium tracking-widest uppercase">No proposals found</span>
            <Link href="/proposals/new" className="text-xs text-indigo-400 font-bold uppercase tracking-widest hover:text-indigo-300">
              Create the first one →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
