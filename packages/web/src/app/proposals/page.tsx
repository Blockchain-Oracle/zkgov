'use client';

import { useEffect, useState } from 'react';
import { API_URL, STATS_LABELS } from '@/lib/constants';
import { ProposalCard } from '@/components/governance/ProposalCard';
import type { ProposalResponse } from '@zkgov/shared';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  const fetchProposals = async () => {
    try {
      const res = await fetch(`${API_URL}/api/proposals?status=${filter === 'all' ? '' : filter}`);
      const data = await res.json();
      setProposals(data.proposals || []);
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [filter]);

  return (
    <div className="flex flex-col gap-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight uppercase">Governance Proposals</h1>
          <p className="text-zinc-500 text-sm max-w-md">
            Cast your anonymous vote on protocol upgrades, treasury allocations, and agent policies.
          </p>
        </div>
        
        <Link 
          href="/proposals/new"
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 text-zinc-900 dark:text-white font-bold text-[11px] tracking-[0.1em] rounded-sm hover:bg-indigo-600 transition-colors uppercase"
        >
          <Plus size={14} />
          Create Proposal
        </Link>
      </div>

      {/* Stats Bar (Frames pattern) */}
      <section className="w-full border-y border-black/[0.04] dark:border-white/[0.04] py-8 grid grid-cols-2 md:grid-cols-4 gap-12 animate-in">
        {[
          { label: STATS_LABELS.PROPOSALS, value: proposals.length.toString() },
          { label: "PARTICIPATION", value: "84%" },
          { label: "AVG. QUORUM", value: "112%" },
          { label: "TOTAL VOTES", value: proposals.reduce((acc, p) => acc + p.totalVotes, 0).toLocaleString() },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1">
            <span className="stat-label uppercase tracking-widest text-zinc-500">{stat.label}</span>
            <span className="stat-value font-bold text-2xl tracking-tight">{stat.value}</span>
          </div>
        ))}
      </section>

      {/* Toolbar: Search + Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text" 
            placeholder="SEARCH PROPOSALS..." 
            className="w-full bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm py-2.5 pl-10 pr-4 text-[11px] font-medium tracking-wider text-zinc-900 dark:text-white focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm p-1">
          {['active', 'succeeded', 'defeated', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-[10px] font-bold tracking-[0.15em] rounded-sm transition-all uppercase ${
                filter === f 
                  ? 'bg-white text-black' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Proposal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in delay-1">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm animate-pulse"></div>
          ))
        ) : proposals.length > 0 ? (
          proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))
        ) : (
          <div className="col-span-full h-64 border border-dashed border-black/[0.06] dark:border-white/[0.06] rounded-sm flex flex-col items-center justify-center gap-4">
            <span className="text-zinc-500 font-medium tracking-widest uppercase">No proposals found</span>
            <button className="text-xs text-indigo-400 font-bold uppercase tracking-widest hover:text-indigo-300">
              Create the first one →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
