'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigTab {
  label: string;
  language: string;
  code: string;
}

interface ConfigTabsProps {
  tabs: ConfigTab[];
}

export function ConfigTabs({ tabs }: ConfigTabsProps) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tabs[active].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="not-prose my-6 rounded-sm border border-black/[0.08] dark:border-white/[0.08] overflow-hidden bg-[#0a0a0a]">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-white/[0.06] bg-[#111] overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={cn(
              'px-4 py-2.5 text-[10px] font-bold tracking-[0.1em] uppercase whitespace-nowrap transition-colors border-b-2',
              active === i
                ? 'text-indigo-400 border-indigo-400 bg-white/[0.03]'
                : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/[0.02]'
            )}
          >
            {tab.label}
          </button>
        ))}

        {/* Copy button */}
        <div className="ml-auto pr-3">
          <button
            onClick={handleCopy}
            className="p-1.5 text-zinc-500 hover:text-white transition-colors"
            aria-label="Copy"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Code body */}
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
        <code className="font-mono text-neutral-200 whitespace-pre">{tabs[active].code}</code>
      </pre>
    </div>
  );
}
