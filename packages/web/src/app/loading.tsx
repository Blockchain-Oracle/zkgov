import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Loading</p>
    </div>
  );
}
