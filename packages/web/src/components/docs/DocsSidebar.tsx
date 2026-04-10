'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOCS_NAVIGATION } from '@/lib/docs';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DocsSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <nav className="flex flex-col gap-8">
      {DOCS_NAVIGATION.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-1">
            {section.title}
          </h3>
          <ul className="flex flex-col gap-0.5">
            {section.pages.map((page) => {
              const href = `/docs/${page.slug}`;
              const isActive = pathname === href;
              return (
                <li key={page.slug}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block px-3 py-2 rounded-sm text-[11px] font-medium tracking-tight transition-colors',
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                    )}
                  >
                    {page.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar — sticky on the left */}
      <aside className="hidden md:block w-56 shrink-0">
        <div className="sticky top-20 py-4">{content}</div>
      </aside>

      {/* Mobile floating toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-indigo-500 border-indigo-600 text-white hover:bg-indigo-600 shadow-lg"
        aria-label="Toggle docs menu"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </Button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-[#F5F2EB] dark:bg-[#0a0a0a] border-r border-black/[0.06] dark:border-white/[0.06] p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">ZKGov Docs</div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
