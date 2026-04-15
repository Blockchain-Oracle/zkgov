'use client';

import { useState } from 'react';
import { Package, GitBranch, Link2, Cpu, Copy, Check, ExternalLink } from 'lucide-react';

interface ResourceEntry {
  label: string;
  value: string;
  description: string;
  copyable?: boolean;
  href?: string;
}

interface ResourceSection {
  title: string;
  icon: React.ReactNode;
  entries: ResourceEntry[];
}

function ResourceCard({ label, value, description, copyable, href }: ResourceEntry) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm">
      <div className="text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase">{label}</div>
      <div className="flex items-center justify-between gap-3">
        <code className="text-xs font-mono text-zinc-900 dark:text-white break-all">{value}</code>
        <div className="flex items-center gap-2 shrink-0">
          {copyable && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold tracking-widest uppercase border border-black/[0.08] dark:border-white/[0.08] rounded-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors text-zinc-500 dark:text-zinc-400"
            >
              {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
              {copied ? 'COPIED' : 'COPY'}
            </button>
          )}
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold tracking-widest uppercase border border-black/[0.08] dark:border-white/[0.08] rounded-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors text-zinc-500 dark:text-zinc-400"
            >
              <ExternalLink size={10} />
              OPEN
            </a>
          )}
        </div>
      </div>
      <p className="text-[11px] text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}

const RESOURCES: ResourceSection[] = [
  {
    title: 'npm Packages',
    icon: <Package size={14} />,
    entries: [
      {
        label: '@zkgov/cli',
        value: 'npm install -g @zkgov/cli',
        description: 'Standalone CLI — query state, register, and vote from your terminal.',
        copyable: true,
        href: 'https://www.npmjs.com/package/@zkgov/cli',
      },
      {
        label: '@zkgov/mcp',
        value: 'npx @zkgov/mcp',
        description: 'MCP server — exposes 11 governance tools to any AI agent via stdio.',
        copyable: true,
        href: 'https://www.npmjs.com/package/@zkgov/mcp',
      },
    ],
  },
  {
    title: 'Source',
    icon: <GitBranch size={14} />,
    entries: [
      {
        label: 'GitHub',
        value: 'github.com/Blockchain-Oracle/zkgov',
        description: 'Monorepo — contracts, CLI, MCP server, web app, and docs.',
        href: 'https://github.com/Blockchain-Oracle/zkgov',
      },
    ],
  },
  {
    title: 'Chain & Contract',
    icon: <Cpu size={14} />,
    entries: [
      {
        label: 'Contract Address',
        value: '0xEa625841E031758786141c8b13dD1b1137C9776C',
        description: 'ZKVoting contract deployed on HashKey Chain Testnet.',
        copyable: true,
        href: 'https://testnet-explorer.hsk.xyz/address/0xEa625841E031758786141c8b13dD1b1137C9776C',
      },
      {
        label: 'Chain',
        value: 'HashKey Chain Testnet — ID: 133',
        description: 'All governance transactions are settled on this network.',
        copyable: false,
      },
      {
        label: 'RPC URL',
        value: 'https://testnet.hsk.xyz',
        description: 'Public RPC endpoint for HashKey Chain Testnet.',
        copyable: true,
      },
      {
        label: 'Block Explorer',
        value: 'testnet-explorer.hsk.xyz',
        description: 'Browse transactions, verify votes, and inspect contract state.',
        href: 'https://testnet-explorer.hsk.xyz',
      },
    ],
  },
  {
    title: 'API',
    icon: <Link2 size={14} />,
    entries: [
      {
        label: 'Base URL',
        value: 'https://api.zkgov.app',
        description: 'REST API backing the web app and CLI. All endpoints return JSON.',
        copyable: true,
      },
      {
        label: 'Stats',
        value: 'GET /api/stats',
        description: 'Returns total proposals, registered members, and comment count.',
        copyable: true,
      },
      {
        label: 'Proposals',
        value: 'GET /api/proposals',
        description: 'List all proposals with vote tallies and status.',
        copyable: true,
      },
      {
        label: 'Activity',
        value: 'GET /api/activity',
        description: 'Recent on-chain events: votes, new proposals, finalizations.',
        copyable: true,
      },
      {
        label: 'Live Feed',
        value: 'GET /api/sse/feed',
        description: 'Server-sent events stream — real-time vote_cast and new_proposal events.',
        copyable: true,
      },
    ],
  },
];

export function ResourcesContent() {
  return (
    <>
      <p className="lead">
        All links, addresses, package names, and API endpoints in one place.
      </p>

      <div className="flex flex-col gap-10 not-prose">
        {RESOURCES.map((section) => (
          <div key={section.title} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
              <span className="text-zinc-500">{section.icon}</span>
              <h2 className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase">{section.title}</h2>
            </div>
            <div className="flex flex-col gap-3">
              {section.entries.map((entry) => (
                <ResourceCard key={entry.label} {...entry} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
