import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDocPage, getAdjacentPages, FLAT_PAGES } from '@/lib/docs';

// Content components
import { IntroductionContent } from '@/components/docs/content/Introduction';
import { QuickstartContent } from '@/components/docs/content/Quickstart';
import { ArchitectureContent } from '@/components/docs/content/Architecture';
import { ZkIdentityContent } from '@/components/docs/content/ZkIdentity';
import { VotingFlowContent } from '@/components/docs/content/VotingFlow';
import { CreateProposalContent } from '@/components/docs/content/CreateProposal';
import { CliContent } from '@/components/docs/content/Cli';
import { McpContent } from '@/components/docs/content/Mcp';
import { ContractsContent } from '@/components/docs/content/Contracts';

const CONTENT_MAP: Record<string, () => React.ReactElement> = {
  introduction: IntroductionContent,
  quickstart: QuickstartContent,
  architecture: ArchitectureContent,
  'zk-identity': ZkIdentityContent,
  'voting-flow': VotingFlowContent,
  'create-proposal': CreateProposalContent,
  cli: CliContent,
  mcp: McpContent,
  contracts: ContractsContent,
};

export async function generateStaticParams() {
  return FLAT_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) return { title: 'Docs — ZKGov' };
  return {
    title: `${page.title} — ZKGov Docs`,
    description: page.description,
  };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getDocPage(slug);
  const Content = CONTENT_MAP[slug];
  if (!page || !Content) notFound();

  const { previous, next } = getAdjacentPages(slug);

  return (
    <article className="flex flex-col gap-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
        <Link href="/docs" className="hover:text-indigo-400 transition-colors">
          Docs
        </Link>
        <ChevronRight size={10} />
        <span className="text-zinc-900 dark:text-white">{page.title}</span>
      </div>

      {/* Title */}
      <header className="flex flex-col gap-3 pb-6 border-b border-black/[0.06] dark:border-white/[0.06]">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {page.title}
        </h1>
        <p className="text-base text-zinc-500 leading-relaxed max-w-2xl">{page.description}</p>
      </header>

      {/* Content */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-sm prose-p:leading-relaxed prose-p:text-zinc-400
          prose-li:text-sm prose-li:leading-relaxed prose-li:text-zinc-400
          prose-strong:text-zinc-900 dark:prose-strong:text-white
          prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
          prose-code:bg-black/[0.04] dark:prose-code:bg-white/[0.06] prose-code:text-xs prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']"
      >
        <Content />
      </div>

      {/* Prev / Next */}
      <nav className="mt-12 pt-8 border-t border-black/[0.06] dark:border-white/[0.06] grid grid-cols-2 gap-4">
        {previous ? (
          <Link
            href={`/docs/${previous.slug}`}
            className="group flex flex-col gap-1 p-4 border border-black/[0.06] dark:border-white/[0.06] rounded-sm hover:border-indigo-500/40 transition-colors"
          >
            <div className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
              <ChevronLeft size={10} /> Previous
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-400 transition-colors">
              {previous.title}
            </span>
          </Link>
        ) : (
          <div></div>
        )}

        {next ? (
          <Link
            href={`/docs/${next.slug}`}
            className="group flex flex-col gap-1 p-4 border border-black/[0.06] dark:border-white/[0.06] rounded-sm hover:border-indigo-500/40 transition-colors text-right"
          >
            <div className="flex items-center gap-1 justify-end text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
              Next <ChevronRight size={10} />
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-400 transition-colors">
              {next.title}
            </span>
          </Link>
        ) : (
          <div></div>
        )}
      </nav>
    </article>
  );
}
