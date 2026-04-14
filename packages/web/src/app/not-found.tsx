import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Search, BookOpen, Vote } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-12 text-center max-w-2xl mx-auto">
      {/* Glitch-style 404 */}
      <div className="relative">
        <div className="text-[160px] md:text-[200px] font-bold tracking-tighter leading-none text-zinc-900 dark:text-white select-none">
          404
        </div>
        <div className="absolute inset-0 text-[160px] md:text-[200px] font-bold tracking-tighter leading-none text-indigo-500/20 select-none translate-x-1 translate-y-1">
          404
        </div>

        {/* Shield overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 rounded-full bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center">
            <Shield size={32} className="text-indigo-400" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-bold tracking-tight uppercase text-zinc-900 dark:text-white">
          This page is beyond the Merkle tree
        </h1>
        <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
          The route you requested does not exist — but there is plenty to explore
          in the governance layer.
        </p>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        <Link
          href="/proposals"
          className="flex flex-col items-center gap-3 p-6 border border-black/[0.06] dark:border-white/[0.06] rounded-sm bg-[#EBE8E1] dark:bg-[#111] hover:border-indigo-500/40 transition-colors group"
        >
          <Vote size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600 dark:text-zinc-400">Proposals</span>
        </Link>

        <Link
          href="/activity"
          className="flex flex-col items-center gap-3 p-6 border border-black/[0.06] dark:border-white/[0.06] rounded-sm bg-[#EBE8E1] dark:bg-[#111] hover:border-emerald-500/40 transition-colors group"
        >
          <Search size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600 dark:text-zinc-400">Activity</span>
        </Link>

        <Link
          href="/docs"
          className="flex flex-col items-center gap-3 p-6 border border-black/[0.06] dark:border-white/[0.06] rounded-sm bg-[#EBE8E1] dark:bg-[#111] hover:border-amber-500/40 transition-colors group"
        >
          <BookOpen size={20} className="text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600 dark:text-zinc-400">Docs</span>
        </Link>
      </div>

      {/* Back button */}
      <Link href="/">
        <Button variant="outline" className="border-black/[0.08] dark:border-white/[0.08] font-bold text-[10px] tracking-[0.2em] uppercase px-8 py-5">
          <ArrowLeft size={14} className="mr-2" /> Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
