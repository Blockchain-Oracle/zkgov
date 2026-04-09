'use client';

import { useAccount } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';
import { useSemaphoreIdentity } from '@/hooks/useSemaphoreIdentity';
import { useIsVoter, useRegister } from '@/hooks/useZKVoting';
import { AddressAvatar } from '@/components/AddressAvatar';
import { EXPLORER_URL } from '@/lib/contracts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Shield, Send, MessageSquare as DiscordIcon,
  CheckCircle2, ExternalLink, Loader2,
} from 'lucide-react';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { user } = useAuth();
  const { identity, commitment, createIdentity, isCreating, hasIdentity } = useSemaphoreIdentity();
  const { data: voterData } = useIsVoter(address as `0x${string}`);
  const { register, isPending: isRegistering, isSuccess: regSuccess, hash: regHash } = useRegister();

  const isRegistered = !!(voterData as any)?.[0];
  const onChainCommitment = (voterData as any)?.[1]?.toString();

  if (!isConnected || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-500">Access Restricted</h2>
        <p className="text-sm text-zinc-600">Connect and sign in to view your profile.</p>
        <appkit-button />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-6">
        <AddressAvatar address={address || ''} size={80} className="border border-black/[0.06] dark:border-white/[0.06]" />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight uppercase">Profile</h1>
          <span className="text-[10px] font-mono text-zinc-500">{address}</span>
          <div className="flex items-center gap-2 mt-1">
            {isRegistered ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 text-[9px] font-bold uppercase tracking-widest">Registered Voter</Badge>
            ) : (
              <Badge className="bg-amber-500/15 text-amber-400 text-[9px] font-bold uppercase tracking-widest">Not Registered</Badge>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-black/[0.06] dark:bg-white/[0.06]" />

      {/* ZK Identity */}
      <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-indigo-400" />
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">ZK Voter Identity</h3>
        </div>

        {!hasIdentity ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-zinc-500">Create your anonymous voter identity by signing a message. Same wallet = same identity (recoverable).</p>
            <Button onClick={() => createIdentity()} disabled={isCreating}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold tracking-widest uppercase w-fit">
              {isCreating ? <><Loader2 size={14} className="animate-spin mr-2" /> Signing...</> : 'Create Identity'}
            </Button>
          </div>
        ) : !isRegistered ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 p-3 bg-black/[0.03] dark:bg-white/[0.03] rounded-sm">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Semaphore Commitment</span>
              <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 break-all">{commitment}</span>
            </div>
            <p className="text-xs text-zinc-500">Register on-chain to join the voter group. One-time transaction.</p>
            <Button onClick={() => { if (identity) register(identity.commitment); }} disabled={isRegistering}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold tracking-widest uppercase w-fit">
              {isRegistering ? <><Loader2 size={14} className="animate-spin mr-2" /> Registering...</> : 'Register On-Chain'}
            </Button>
            {regHash && (
              <a href={`${EXPLORER_URL}/tx/${regHash}`} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-indigo-400 flex items-center gap-1 hover:underline">
                View transaction <ExternalLink size={10} />
              </a>
            )}
            {regSuccess && <p className="text-xs text-emerald-400"><CheckCircle2 size={12} className="inline mr-1" />Registered!</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 p-3 bg-black/[0.03] dark:bg-white/[0.03] rounded-sm">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Status</span>
              <span className="text-xs font-bold text-emerald-400 uppercase">Registered Voter</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-black/[0.03] dark:bg-white/[0.03] rounded-sm">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Commitment</span>
              <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 break-all">{onChainCommitment?.slice(0, 20)}...</span>
            </div>
          </div>
        )}

        <p className="text-[10px] text-zinc-600 mt-3 leading-relaxed">
          Your Semaphore commitment is on-chain. When you vote, a ZK proof proves membership without revealing your address.
        </p>
      </Card>

      {/* Platform Links */}
      <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06]">
        <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-4">Platform Links</h3>
        <div className="flex flex-col gap-2">
          <a href="https://t.me/zkgovbot?start=link" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-black/[0.03] dark:bg-white/[0.03] rounded-sm hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center gap-3">
              <Send size={16} className={user.telegramLinked ? "text-[#24A1DE]" : "text-zinc-600"} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Telegram</span>
            </div>
            {user.telegramLinked ? <CheckCircle2 size={14} className="text-emerald-500" /> : <span className="text-[10px] text-zinc-500">Open Bot</span>}
          </a>
          <a href="https://discord.gg/zkgov" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-black/[0.03] dark:bg-white/[0.03] rounded-sm hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center gap-3">
              <DiscordIcon size={16} className={user.discordLinked ? "text-[#5865F2]" : "text-zinc-600"} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Discord</span>
            </div>
            {user.discordLinked ? <CheckCircle2 size={14} className="text-emerald-500" /> : <span className="text-[10px] text-zinc-500">Join Server</span>}
          </a>
        </div>
      </Card>
    </div>
  );
}
