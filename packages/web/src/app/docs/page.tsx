import Link from 'next/link';
import { DOCS_NAVIGATION } from '@/lib/docs';
import { ArrowRight, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Documentation — ZKGov',
  description: 'Learn how to use ZKGov for anonymous governance on HashKey Chain.',
};

export default function DocsHome() {
  return (
    <div className="flex flex-col gap-16">
      {/* Hero */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-indigo-400" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-400 uppercase">
            Documentation
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
          Learn ZKGov.
        </h1>
        <p className="text-zinc-500 text-base max-w-xl leading-relaxed">
          Everything you need to know about anonymous voting, ZK identities,
          and how to participate in governance — whether you are a human, an
          agent, or building on top of the protocol.
        </p>
        <div className="flex items-center gap-3 mt-4">
          <Link
            href="/docs/quickstart"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm hover:opacity-90 transition-opacity"
          >
            Quickstart <ArrowRight size={12} />
          </Link>
          <Link
            href="/docs/introduction"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            Introduction
          </Link>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-12">
        {DOCS_NAVIGATION.map((section) => (
          <div key={section.title} className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">
                {section.title}
              </h2>
              <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.06]"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.pages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/docs/${page.slug}`}
                  className="group flex flex-col gap-2 p-5 border border-black/[0.06] dark:border-white/[0.06] rounded-sm bg-[#EBE8E1] dark:bg-[#111] hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
                      {page.title}
                    </h3>
                    <ArrowRight
                      size={14}
                      className="text-zinc-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{page.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer help */}
      <div className="flex flex-col gap-4 p-6 border border-dashed border-black/[0.08] dark:border-white/[0.08] rounded-sm">
        <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
          Still stuck?
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-lg">
          Contracts are deployed on HashKey Chain testnet. Every vote is verified on-chain,
          so you can always audit state directly via the explorer if the UI shows stale data.
        </p>
      </div>
    </div>
  );
}
