'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Send, 
  MessageSquare as DiscordIcon, 
  Plus, 
  Key, 
  User, 
  Cpu, 
  Copy, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { API_URL } from '@/lib/constants';

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const { address } = useAccount();
  const [isRegisteringAgent, setIsRegisteringAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRegisterAgent = async () => {
    if (!token || !newAgentName) return;
    try {
      const res = await fetch(`${API_URL}/api/agents`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ name: newAgentName }),
      });
      const data = await res.json();
      if (res.ok) {
        setApiKey(data.agent.apiKey);
        setNewAgentName('');
        setIsRegisteringAgent(false);
        refreshUser();
      }
    } catch (err) {
      console.error('Failed to register agent:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-500">Access Restricted</h2>
        <p className="text-sm text-zinc-600">Connect and sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 max-w-4xl mx-auto w-full">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 animate-in">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-sm bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-zinc-500">
            <User size={40} strokeWidth={1} />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight uppercase">User Profile</h1>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                {address?.slice(0, 10)}...{address?.slice(-8)}
              </span>
              <Badge variant="outline" className="text-[9px] border-black/10 dark:border-white/10 text-zinc-400 rounded-sm">
                REGISTERED {new Date(user.createdAt).getFullYear()}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {user.kycVerified ? (
            <div className="px-4 py-2 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-sm flex items-center gap-3">
              <CheckCircle2 size={16} />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest">KYC Status</span>
                <span className="text-[11px] font-bold uppercase">{user.kycLevel}</span>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={async () => {
                try {
                  const res = await fetch(`${API_URL}/api/auth/verify-kyc`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({}),
                  });
                  if (res.ok) refreshUser();
                } catch {}
              }}
              className="px-4 py-2 border border-amber-500/20 bg-amber-500/5 text-amber-400 rounded-sm flex items-center gap-3 hover:bg-amber-500/10 transition-colors"
            >
              <AlertCircle size={16} />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold uppercase tracking-widest">KYC Status</span>
                <span className="text-[11px] font-bold uppercase">Click to verify</span>
              </div>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Account & Links */}
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-4 animate-in delay-1">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-600 uppercase">Platform Links</h3>
            <div className="flex flex-col gap-2">
              <a
                href="https://t.me/zkgov_bot?start=link"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm hover:border-black/[0.15] dark:hover:border-white/[0.15] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Send size={16} className={cn(user.telegramLinked ? "text-[#24A1DE]" : "text-zinc-600")} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Telegram</span>
                </div>
                {user.telegramLinked ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white uppercase">Open Bot</span>
                )}
              </a>

              <div
                className="flex items-center justify-between p-4 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm hover:border-black/[0.15] dark:hover:border-white/[0.15] transition-colors group cursor-pointer"
                onClick={() => {
                  // Discord linking requires the bot to be set up with a client ID
                  // For now, direct users to use /link in Discord
                  window.open('https://discord.gg/zkgov', '_blank');
                }}
              >
                <div className="flex items-center gap-3">
                  <DiscordIcon size={16} className={cn(user.discordLinked ? "text-[#5865F2]" : "text-zinc-600")} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Discord</span>
                </div>
                {user.discordLinked ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white uppercase">Join Server</span>
                )}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 animate-in delay-2">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-600 uppercase">Voting Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm flex flex-col gap-1">
                <span className="text-[9px] font-bold text-zinc-600 uppercase">Agents</span>
                <span className="text-xl font-bold tracking-tighter">{user?.agents?.length || 0}</span>
              </div>
              <div className="p-4 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm flex flex-col gap-1">
                <span className="text-[9px] font-bold text-zinc-600 uppercase">KYC Level</span>
                <span className="text-xl font-bold tracking-tighter">{user?.kycLevel || '—'}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: AI Agents */}
        <div className="md:col-span-2 flex flex-col gap-6 animate-in delay-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-600 uppercase">Authorized AI Agents</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsRegisteringAgent(true)}
              className="h-8 border-black/10 dark:border-white/10 text-[10px] font-bold tracking-widest uppercase"
            >
              <Plus size={14} className="mr-1" /> Register Agent
            </Button>
          </div>

          {isRegisteringAgent && (
            <Card className="p-6 bg-[#EBE8E1] dark:bg-[#111] border-indigo-500/30 flex flex-col gap-4 animate-in">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Agent Name</label>
                <Input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="E.G. TREASURY_ANALYZER_V1"
                  className="bg-[#F5F2EB] dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-sm py-2 px-3 text-xs font-mono focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleRegisterAgent}
                  className="bg-indigo-500 hover:bg-indigo-600 text-[10px] font-bold uppercase tracking-widest h-9"
                >
                  Confirm Registration
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsRegisteringAgent(false)}
                  className="text-[10px] font-bold uppercase tracking-widest h-9"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {apiKey && (
            <div className="p-6 bg-indigo-500/10 border border-indigo-500/30 rounded-sm flex flex-col gap-4 animate-in">
              <div className="flex items-center gap-2 text-indigo-400">
                <Key size={16} />
                <h4 className="text-xs font-bold uppercase tracking-widest">New API Key Created</h4>
              </div>
              <p className="text-[11px] text-zinc-400">
                Copy this key now. It will not be shown again. Use it to authorize your agent via the ZKGov API.
              </p>
              <div className="flex items-center gap-2 bg-[#F5F2EB] dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-sm p-3">
                <code className="flex-1 text-[11px] font-mono text-zinc-300 overflow-hidden text-ellipsis whitespace-nowrap">
                  {apiKey}
                </code>
                <Button
                  variant="ghost"
                  onClick={() => copyToClipboard(apiKey)}
                  className="p-2 hover:bg-white/5 rounded-sm transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                >
                  {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {(user.agents?.length || 0) > 0 ? (
              user.agents.map((agent: { id: string; name: string; isActive: boolean }) => (
                <div key={agent.id} className="flex items-center justify-between p-5 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm group hover:border-black/[0.15] dark:hover:border-white/[0.15] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-sm bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Cpu size={20} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">{agent.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        ID: {agent.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Status</span>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">ACTIVE</span>
                    </div>
                    <Button variant="ghost" className="h-9 w-9 p-0 text-zinc-600 hover:text-rose-400">
                      <AlertCircle size={18} />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-48 border border-dashed border-black/[0.06] dark:border-white/[0.06] rounded-sm flex flex-col items-center justify-center gap-4 text-center">
                <span className="text-zinc-600 text-[11px] font-bold uppercase tracking-[0.2em]">No Agents Authorized</span>
                <p className="text-[10px] text-zinc-700 max-w-xs text-center leading-relaxed">
                  Register an AI agent to allow it to participate in governance on your behalf.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
