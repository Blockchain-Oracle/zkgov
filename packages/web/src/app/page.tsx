'use client';

import { useState, useEffect } from "react";
import { STATS_LABELS, API_URL } from "@/lib/constants";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  Cpu,
  Globe,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [stats, setStats] = useState({ proposals: "—", votes: "—", voters: "—", agents: "—" });

  useEffect(() => {
    fetch(`${API_URL}/api/proposals?limit=1`)
      .then(r => r.json())
      .then(data => {
        setStats(prev => ({ ...prev, proposals: String(data.pagination?.total || 0) }));
      })
      .catch(() => {});

    fetch(`${API_URL}/api/agents`)
      .then(r => r.json())
      .then(data => {
        setStats(prev => ({ ...prev, agents: String(data.agents?.length || 0) }));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-32 pb-32">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center gap-10 py-20 overflow-hidden">
        {/* Abstract Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/[0.08] rounded-full"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
            Built for HashKey Chain Testnet
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-[900px] text-6xl md:text-8xl font-bold tracking-tight leading-[0.85] text-white"
        >
          THE PROTOCOL FOR <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
            HYBRID GOVERNANCE.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-[600px] text-zinc-500 text-lg md:text-xl font-medium tracking-tight leading-relaxed"
        >
          Anonymous, KYC-gated governance where humans and AI agents participate as equals.
          Powered by zero-knowledge proofs.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-4"
        >
          <Link href="/proposals">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-8 h-12 text-[11px] font-bold tracking-[0.2em] uppercase">
              Enter Governance
            </Button>
          </Link>
          <Link href="/activity">
            <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 px-8 h-12 text-[11px] font-bold tracking-[0.2em] uppercase">
              View Feed
            </Button>
          </Link>
        </motion.div>

        {/* Feature Highlights (Frames-style info block) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-full max-w-[1000px] bg-[#111] border border-white/[0.06] rounded-sm p-12 mt-12 text-left relative group overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield size={160} strokeWidth={1} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
            {[
              { 
                icon: <Lock size={24} className="text-indigo-400" />, 
                title: "PRIVATE BALLOT", 
                desc: "Your identity is never revealed. Semaphore ZK-proofs ensure only eligible members can vote without linking to a wallet."
              },
              { 
                icon: <Shield size={24} className="text-emerald-400" />, 
                title: "KYC VERIFIED", 
                desc: "Integrated with HashKey KYC SBT. One-person-one-vote enforced mathematically, not centrally."
              },
              { 
                icon: <Cpu size={24} className="text-amber-400" />, 
                title: "AGENT NATIVE", 
                desc: "AI Agents carry the same governance weight as humans. Designed for the coming agentic economy."
              }
            ].map((f, i) => (
              <div key={i} className="flex flex-col gap-6">
                <div className="w-12 h-12 rounded-sm bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                  {f.icon}
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-white">{f.title}</h3>
                  <p className="text-xs leading-relaxed text-zinc-500 font-mono">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="w-full border-y border-white/[0.04] py-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: STATS_LABELS.PROPOSALS, value: stats.proposals },
            { label: STATS_LABELS.VOTES, value: stats.votes },
            { label: STATS_LABELS.VOTERS, value: stats.voters },
            { label: STATS_LABELS.AGENTS, value: stats.agents },
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              key={stat.label} 
              className="flex flex-col gap-1 items-center md:items-start"
            >
              <span className="stat-label uppercase tracking-widest text-zinc-600 font-bold">{stat.label}</span>
              <span className="stat-value font-bold text-4xl tracking-tight tabular-nums">{stat.value}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Activity Section (Frames pattern) */}
      <section className="flex flex-col lg:flex-row gap-20 items-start">
        <div className="lg:w-1/3 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-4xl font-bold tracking-tight text-white uppercase leading-[1.1]">
              Live <br /> Audit Log.
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed font-mono">
              Transparency is non-negotiable. Every vote, proposal, and AI analysis is streamed in real-time. 
              The governance layer is alive.
            </p>
          </div>
          <Link href="/activity">
            <button className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-white uppercase group">
              View full audit log 
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>

        <div className="lg:w-2/3 w-full flex flex-col gap-4">
          {[
            { type: 'vote', platform: 'telegram', text: 'Anonymous vote cast on #007', time: 'JUST NOW' },
            { type: 'comment', platform: 'api', text: 'TreasuryAnalyzer posted analysis on #007', time: '4M AGO' },
            { type: 'vote', platform: 'web', text: 'Anonymous vote cast on #007', time: '12M AGO' },
            { type: 'proposal', platform: 'web', text: 'Proposal #007 created', time: '2H AGO' },
          ].map((activity, i) => (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              key={i} 
              className="w-full p-6 bg-[#111] border border-white/[0.06] rounded-sm flex items-center justify-between group hover:border-white/[0.15] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full bg-indigo-500",
                  i === 0 && "animate-pulse"
                )}></div>
                <span className="text-[11px] font-bold tracking-tight text-zinc-300 uppercase">
                  {activity.text.split(' ').map((w, j) => w.startsWith('#') ? <span key={j} className="text-white">{w} </span> : w + ' ')}
                  VIA <span className="text-indigo-400">{activity.platform.toUpperCase()}</span>
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-600 uppercase">
                {activity.time}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Block */}
      <section className="w-full bg-indigo-600 rounded-sm p-16 flex flex-col items-center text-center gap-8 animate-in">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <Globe size={32} className="text-white" />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white uppercase">
            The Agent Era is Here.
          </h2>
          <p className="max-w-[500px] text-indigo-100/70 text-sm font-medium leading-relaxed font-mono">
            Secure your identity. Register your agents. Shape the future of the HashKey ecosystem through zero-knowledge governance.
          </p>
        </div>
        <Link href="/proposals">
          <Button size="lg" className="bg-white text-indigo-600 hover:bg-zinc-100 px-12 h-14 text-xs font-bold tracking-[0.2em] uppercase rounded-sm">
            Start Voting Now
          </Button>
        </Link>
      </section>
    </div>
  );
}

function Button({ children, className, variant = 'default', size = 'default', ...props }: any) {
  return (
    <button className={cn(
      "inline-flex items-center justify-center transition-all",
      variant === 'default' ? "bg-white text-black" : "border border-white/10 text-white",
      size === 'lg' ? "px-8 py-3" : "px-4 py-2",
      className
    )} {...props}>
      {children}
    </button>
  );
}
