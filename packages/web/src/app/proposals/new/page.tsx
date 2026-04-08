'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Clock, 
  Users, 
  Target, 
  Info, 
  AlertCircle, 
  Loader2,
  ChevronLeft,
  Shield
} from 'lucide-react';
import Link from 'next/link';

export default function NewProposalPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    votingPeriod: '172800', // 48 hours in seconds
    quorum: '10',
    voterGroup: 'both',
    proposalType: 'verified' as 'verified' | 'open',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          votingPeriod: parseInt(formData.votingPeriod),
          quorum: parseInt(formData.quorum)
        })
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/proposals/${data.proposal.id}`);
      } else {
        throw new Error(data.error || 'Failed to create proposal');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!user?.kycVerified) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <AlertCircle size={32} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-900 dark:text-white">KYC Required</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Only KYC-verified members can create new proposals. Please verify your status in your profile to continue.
          </p>
        </div>
        <Link href="/profile">
          <Button className="bg-white text-black hover:bg-zinc-200 text-[11px] font-bold uppercase tracking-widest px-8">
            Go to Profile
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-10 pb-24">
      <div className="flex flex-col gap-2 animate-in">
        <Link href="/proposals" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors text-[10px] font-bold tracking-widest uppercase mb-4">
          <ChevronLeft size={14} /> Back to Proposals
        </Link>
        <h1 className="text-3xl font-bold tracking-tight uppercase text-zinc-900 dark:text-white">Create Proposal</h1>
        <p className="text-zinc-500 text-sm">
          Define the parameters for your protocol upgrade or community initiative.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 animate-in delay-1">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <FileText size={12} /> Proposal Title
            </label>
            <Input 
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="E.G. INCREASE TREASURY ALLOCATION FOR DEV GRANTS"
              className="bg-[#EBE8E1] dark:bg-[#111] border-black/10 dark:border-white/10 text-sm font-bold tracking-tight h-12"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Info size={12} /> Description (Markdown)
            </label>
            <textarea 
              required
              rows={12}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your proposal in detail. Use markdown for structure."
              className="w-full bg-[#EBE8E1] dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-sm p-4 text-sm font-mono text-zinc-300 focus:border-indigo-500/50 outline-none transition-colors resize-none"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={12} /> Voting Period
            </label>
            <select 
              value={formData.votingPeriod}
              onChange={(e) => setFormData({ ...formData, votingPeriod: e.target.value })}
              className="w-full bg-[#EBE8E1] dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-sm h-12 px-3 text-[11px] font-bold uppercase tracking-widest outline-none focus:border-indigo-500/50 transition-colors"
            >
              <option value="86400">24 Hours</option>
              <option value="172800">48 Hours</option>
              <option value="259200">72 Hours</option>
              <option value="604800">1 Week</option>
              <option value="1209600">2 Weeks</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Target size={12} /> Quorum Target
            </label>
            <Input 
              type="number"
              min="1"
              required
              value={formData.quorum}
              onChange={(e) => setFormData({ ...formData, quorum: e.target.value })}
              className="bg-[#EBE8E1] dark:bg-[#111] border-black/10 dark:border-white/10 text-sm font-bold tracking-tight h-12"
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Users size={12} /> Voter Eligibility
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['both', 'humans', 'agents'].map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setFormData({ ...formData, voterGroup: group })}
                  className={cn(
                    "py-3 border text-[10px] font-bold uppercase tracking-[0.15em] rounded-sm transition-all",
                    formData.voterGroup === group 
                      ? "bg-white text-black border-white" 
                      : "bg-transparent text-zinc-500 border-black/10 dark:border-white/10 hover:border-white/30"
                  )}
                >
                  {group === 'both' ? 'HUMANS + AGENTS' : group}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Shield size={12} /> Verification Requirement
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'verified', label: 'KYC VERIFIED ONLY', desc: 'Only KYC-verified voters can participate' },
                { value: 'open', label: 'OPEN TO ALL', desc: 'Anyone with a wallet can vote' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, proposalType: opt.value as 'verified' | 'open' })}
                  className={cn(
                    "py-3 px-4 border text-left rounded-sm transition-all",
                    formData.proposalType === opt.value
                      ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                      : "bg-transparent text-zinc-500 border-black/10 dark:border-white/10 hover:border-white/30"
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] block">{opt.label}</span>
                  <span className="text-[9px] text-zinc-600 mt-1 block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-sm flex items-center gap-3">
            <AlertCircle className="text-rose-400" size={16} />
            <p className="text-xs text-rose-400 font-bold uppercase tracking-tight">{error}</p>
          </div>
        )}

        <Separator className="bg-white/[0.06] my-2" />

        <div className="flex flex-col md:flex-row items-center gap-6">
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto px-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-zinc-900 dark:text-white font-bold text-[11px] uppercase tracking-[0.2em] transition-all"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            {loading ? 'PUBLISHING...' : 'PUBLISH PROPOSAL'}
          </Button>
          <div className="flex items-center gap-2 text-zinc-600">
            <Shield size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]">On-chain verification required</span>
          </div>
        </div>
      </form>
    </div>
  );
}
