import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-8 text-center">
      <div className="w-20 h-20 rounded-sm bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center">
        <Shield size={40} className="text-zinc-400" strokeWidth={1} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-6xl font-bold tracking-tight">404</h1>
        <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">Page not found</p>
      </div>
      <Link href="/"><Button variant="outline" className="border-black/10 dark:border-white/10 font-bold text-sm tracking-wider uppercase">
        <ArrowLeft size={14} className="mr-2" /> Back to Dashboard
      </Button></Link>
    </div>
  );
}
