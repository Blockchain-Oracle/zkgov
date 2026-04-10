import { DocsSidebar } from '@/components/docs/DocsSidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-12 w-full">
      <DocsSidebar />
      <main className="flex-1 min-w-0 max-w-3xl py-4">{children}</main>
    </div>
  );
}
