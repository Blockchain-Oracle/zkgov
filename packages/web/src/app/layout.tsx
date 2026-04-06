import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NAVIGATION_ITEMS, APP_NAME, TAGLINE } from "@/lib/constants";
import Link from "next/link";
import { AppProviders } from "@/components/Providers";
import { NavContent } from "@/components/NavContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} | ${TAGLINE}`,
  description: "Anonymous, KYC-gated governance for humans and AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col font-mono bg-[#F5F2EB] dark:bg-[#0a0a0a] text-[#1a1a1a] dark:text-[#fafafa] transition-colors duration-300">
        <AppProviders>
          {/* Top Announcement Bar */}
          <div className="w-full bg-[#EBE8E1] dark:bg-[#111] border-b border-black/[0.06] dark:border-white/[0.04] py-1.5 px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="text-[10px] font-medium tracking-[0.15em] text-zinc-500 uppercase">
                Agent-Friendly Governance Infrastructure
              </span>
            </div>
            <div className="text-[10px] font-medium tracking-[0.05em] text-indigo-500 dark:text-indigo-400/80 uppercase">
              HashKey Chain Testnet Active
            </div>
          </div>

          <NavContent />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col max-w-[1400px] w-full mx-auto px-6 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="w-full border-t border-zinc-200 dark:border-white/[0.06] py-12 px-6 mt-auto">
            <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-[11px] font-medium tracking-[0.1em] text-zinc-500 uppercase">
                {APP_NAME} — {TAGLINE}
              </div>
              <div className="flex items-center gap-8">
                {[
                  { label: "GITHUB", href: "https://github.com/zkgov" },
                  { label: "TELEGRAM", href: "https://t.me/zkgov" },
                  { label: "X", href: "https://x.com/zkgov" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-medium tracking-[0.15em] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
