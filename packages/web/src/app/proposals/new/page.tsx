'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useCreateProposalTx } from '@/hooks/useZKVoting';
import { EXPLORER_URL } from '@/lib/contracts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FileText, Clock, Target, ChevronLeft, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function NewProposalPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { create, isPending, isConfirming, isSuccess, hash, error } = useCreateProposalTx();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    votingPeriod: '172800',
    quorum: '5',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;
    create(formData.title, formData.description, parseInt(formData.votingPeriod), parseInt(formData.quorum));
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold uppercase tracking-widest">Connect Wallet</h2>
        <p className="text-zinc-500 text-sm">Connect your wallet to create governance proposals.</p>
        <appkit-button />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center max-w-md mx-auto">
        <CheckCircle2 size={48} className="text-emerald-400" />
        <h2 className="text-xl font-bold uppercase tracking-widest">Proposal Created</h2>
        <p className="text-zinc-500 text-sm">Your proposal has been submitted on-chain.</p>
        {hash && (
          <a href={`${EXPLORER_URL}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-indigo-400 flex items-center gap-1 hover:underline">
            View on Explorer <ExternalLink size={12} />
          </a>
        )}
        <Link href="/proposals">
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest px-8">
            View Proposals
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-10 pb-24">
      <div className="flex flex-col gap-2">
        <Link href="/proposals" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors text-[10px] font-bold tracking-widest uppercase mb-4">
          <ChevronLeft size={14} /> Back to Proposals
        </Link>
        <h1 className="text-3xl font-bold tracking-tight uppercase">Create Proposal</h1>
        <p className="text-zinc-500 text-sm">Submit a governance proposal on-chain. You sign the transaction directly.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <FileText size={12} /> Title
          </label>
          <Input
            required value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="E.G. ALLOCATE TREASURY TO DEV GRANTS"
            className="bg-[#EBE8E1] dark:bg-[#111] border-black/10 dark:border-white/10 text-sm font-bold tracking-tight h-12"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <FileText size={12} /> Description (Markdown)
          </label>
          <Textarea
            required rows={10} value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your proposal in detail."
            className="bg-[#EBE8E1] dark:bg-[#111] border-black/10 dark:border-white/10 text-sm font-mono resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={12} /> Voting Period
            </label>
            <Select value={formData.votingPeriod} onValueChange={(v) => v && setFormData({ ...formData, votingPeriod: v })}>
              <SelectTrigger className="bg-[#EBE8E1] dark:bg-[#111] border-black/10 dark:border-white/10 h-12 text-[11px] font-bold uppercase tracking-widest">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="86400">24 Hours</SelectItem>
                <SelectItem value="172800">48 Hours</SelectItem>
                <SelectItem value="259200">72 Hours</SelectItem>
                <SelectItem value="604800">1 Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Target size={12} /> Quorum
            </label>
            <Input
              type="number" min="1" required value={formData.quorum}
              onChange={(e) => setFormData({ ...formData, quorum: e.target.value })}
              className="bg-[#EBE8E1] dark:bg-[#111] border-black/10 dark:border-white/10 text-sm font-bold tracking-tight h-12"
            />
          </div>
        </div>

        <Separator className="bg-black/[0.06] dark:bg-white/[0.06]" />

        <Button type="submit" disabled={isPending || isConfirming}
          className="bg-indigo-500 hover:bg-indigo-600 text-white h-12 text-[11px] font-bold tracking-[0.2em] uppercase">
          {isPending ? <><Loader2 size={14} className="animate-spin mr-2" /> Sign Transaction...</>
          : isConfirming ? <><Loader2 size={14} className="animate-spin mr-2" /> Confirming...</>
          : 'Create Proposal On-Chain'}
        </Button>

        {error && <p className="text-xs text-rose-400">{(error as any)?.message || 'Transaction failed'}</p>}
      </form>
    </div>
  );
}
