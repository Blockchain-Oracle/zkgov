'use client';

import { useState } from 'react';
import { Copy, Check, Download, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const INSTALL_METHODS = [
  {
    label: 'Skills CLI',
    code: 'pnpm dlx skills add github:Blockchain-Oracle/zkgov --skill zkgov',
  },
  {
    label: 'npx',
    code: 'npx skills add github:Blockchain-Oracle/zkgov --skill zkgov',
  },
  {
    label: 'Prompt',
    code: 'Read https://zkgov.app/skill.md and follow the instructions.',
  },
];

const AGENT_PATHS = [
  { name: 'Claude Code', path: '~/.claude/skills/zkgov/SKILL.md' },
  { name: 'Cursor', path: '~/.cursor/skills/zkgov/SKILL.md' },
  { name: 'Windsurf', path: '~/.codeium/windsurf/skills/zkgov/SKILL.md' },
  { name: 'VS Code Copilot', path: '~/.copilot/skills/zkgov/SKILL.md' },
  { name: 'Codex CLI', path: '~/.agents/skills/zkgov/SKILL.md' },
  { name: 'Gemini CLI', path: '~/.gemini/skills/zkgov/SKILL.md' },
  { name: 'Cline', path: '~/.cline/skills/zkgov/SKILL.md' },
  { name: 'Goose', path: '~/.config/agents/skills/zkgov/SKILL.md' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded-sm hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
      aria-label="Copy"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-zinc-500" />}
    </button>
  );
}

export default function SkillPage() {
  const [activeMethod, setActiveMethod] = useState(0);

  return (
    <div className="flex flex-col gap-16 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-indigo-400 uppercase">
          Agent Skill
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
          Teach any agent<br />ZKGov governance.
        </h1>
        <p className="text-zinc-500 text-base max-w-xl leading-relaxed">
          A single <code className="text-xs bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded-sm">SKILL.md</code> file
          that instructs AI agents when and how to use ZKGov tools — works across
          Claude Code, Cursor, Windsurf, Codex, Gemini CLI, and more.
        </p>
      </div>

      {/* Install methods */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Install</h2>

        <div className="flex items-center gap-2 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm p-1">
          {INSTALL_METHODS.map((m, i) => (
            <Button
              key={m.label}
              variant="ghost"
              size="sm"
              onClick={() => setActiveMethod(i)}
              className={cn(
                'px-4 py-1.5 text-[10px] font-bold tracking-[0.15em] rounded-sm uppercase whitespace-nowrap',
                activeMethod === i
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                  : 'text-zinc-500'
              )}
            >
              {m.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3 p-4 bg-[#0a0a0a] rounded-sm border border-white/[0.08]">
          <code className="flex-1 text-xs font-mono text-emerald-400 break-all">
            {INSTALL_METHODS[activeMethod].code}
          </code>
          <CopyButton text={INSTALL_METHODS[activeMethod].code} />
        </div>
      </div>

      {/* Agent paths */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
          Supported Agents — Skill File Paths
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AGENT_PATHS.map((agent) => (
            <div
              key={agent.name}
              className="flex items-center justify-between p-3 border border-black/[0.06] dark:border-white/[0.06] rounded-sm bg-[#EBE8E1] dark:bg-[#111]"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-zinc-900 dark:text-white">{agent.name}</span>
                <code className="text-[9px] font-mono text-zinc-500 break-all">{agent.path}</code>
              </div>
              <CopyButton text={agent.path} />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="/skill.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm hover:opacity-90 transition-opacity"
        >
          <Download size={14} /> Download SKILL.md
        </a>
        <Link
          href="/docs/skills"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm hover:bg-zinc-100 dark:hover:bg-white/[0.03] transition-colors"
        >
          Read Docs <ChevronRight size={12} />
        </Link>
        <a
          href="https://github.com/Blockchain-Oracle/zkgov"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm hover:bg-zinc-100 dark:hover:bg-white/[0.03] transition-colors"
        >
          GitHub <ExternalLink size={12} />
        </a>
      </div>

      {/* Combine with MCP */}
      <div className="p-6 border border-dashed border-black/[0.08] dark:border-white/[0.08] rounded-sm flex flex-col gap-3">
        <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
          Best with MCP server
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-lg">
          The skill teaches your agent <em>when</em> to act. The MCP server gives it the <em>tools</em> to act.
          For the full experience, install both.
        </p>
        <code className="text-xs font-mono text-indigo-400 bg-black/[0.04] dark:bg-white/[0.04] px-3 py-2 rounded-sm">
          claude mcp add zkgov npx @zkgov/mcp
        </code>
      </div>
    </div>
  );
}
