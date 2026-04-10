'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({ code, language = 'bash', filename, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={cn('not-prose my-6 rounded-sm border border-black/[0.08] dark:border-white/[0.08] overflow-hidden bg-[#0a0a0a]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500/60"></span>
          <span className="w-2 h-2 rounded-full bg-amber-500/60"></span>
          <span className="w-2 h-2 rounded-full bg-emerald-500/60"></span>
          {filename && (
            <span className="ml-2 text-[10px] font-mono tracking-tight text-zinc-500">{filename}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold tracking-widest text-zinc-600 uppercase">{language}</span>
          <button
            onClick={handleCopy}
            className="text-zinc-500 hover:text-white transition-colors"
            aria-label="Copy code"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Code body */}
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
        <code className="font-mono text-zinc-300 whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

/**
 * Inline callout box — info / warning / success / tip
 */
export function Callout({
  children,
  type = 'info',
  title,
}: {
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success' | 'tip';
  title?: string;
}) {
  const styles = {
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    tip: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
  };
  return (
    <div className={cn('not-prose my-6 p-4 border rounded-sm', styles[type])}>
      {title && <div className="text-[10px] font-bold tracking-widest uppercase mb-2">{title}</div>}
      <div className="text-sm text-zinc-300 leading-relaxed">{children}</div>
    </div>
  );
}
