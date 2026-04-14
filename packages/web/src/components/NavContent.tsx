'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAccount, useDisconnect } from "wagmi";
import { NAVIGATION_ITEMS, APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Sun, Moon, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "motion/react";

export function NavContent() {
  const pathname = usePathname();
  const { user, login, logout, isSigning, isLoading } = useAuth();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const saved = localStorage.getItem("zkgov-theme");
    if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("zkgov-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("zkgov-theme", "light");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F5F2EB]/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.06] transition-colors duration-300">
      <nav className="max-w-[1400px] mx-auto h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
            <img src="/logo.svg" alt="ZKGov" className="w-8 h-8 rounded-sm transition-transform group-hover:scale-95" />
            <span className="font-bold text-lg tracking-[-0.03em] select-none">
              {APP_NAME}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAVIGATION_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "nav-pill text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase",
                  (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) && "active text-zinc-900 dark:text-white"
                )}
              >
                {item.label}
              </Link>

            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-sm border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-400 dark:hover:border-white/20 transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </Button>

          {/* Hamburger button — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-sm border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-400 dark:hover:border-white/20 transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </Button>

          <div className="hidden md:flex items-center">
            {!mounted ? (
              /* Placeholder during SSR to prevent hydration mismatch */
              <div className="w-[140px] h-[40px] bg-zinc-200 dark:bg-white/5 rounded-sm animate-pulse" />
            ) : isConnected ? (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="flex items-center gap-3 px-4 py-2 bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.1] rounded-sm hover:bg-zinc-200 dark:hover:bg-white/[0.08] transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[11px] font-bold tracking-tight uppercase">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/10 rounded-sm shadow-lg">
                    <Link href="/profile">
                      <DropdownMenuItem className="px-4 py-3 text-[11px] font-bold tracking-widest uppercase text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
                        Profile
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem
                      onClick={() => { logout(); disconnect(); }}
                      className="px-4 py-3 text-[11px] font-bold tracking-widest uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border-t border-zinc-200 dark:border-white/10 cursor-pointer"
                    >
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={login}
                  disabled={isSigning}
                  className="px-5 py-2 bg-indigo-500 text-zinc-900 dark:text-white font-bold text-[11px] tracking-[0.1em] rounded-sm hover:bg-indigo-600 transition-colors uppercase disabled:opacity-50"
                >
                  {isSigning ? "SIGNING..." : "SIGN IN TO GOVERN"}
                </Button>
              )
            ) : (
              <appkit-button />
            )}
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-16 z-40 md:hidden bg-black/20 dark:bg-black/40"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.nav
              key="mobile-drawer"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-16 left-0 right-0 z-50 md:hidden bg-[#F5F2EB] dark:bg-[#0a0a0a] border-b border-black/[0.06] dark:border-white/[0.06]"
            >
              <div className="max-w-[1400px] mx-auto px-4 py-3">
                {/* Nav links */}
                <div className="flex flex-col">
                  {NAVIGATION_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "px-4 py-3 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors rounded-sm",
                          isActive
                            ? "text-zinc-900 dark:text-white bg-black/[0.04] dark:bg-white/[0.04]"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Auth section */}
                <div className="border-t border-black/[0.06] dark:border-white/[0.06] mt-2 pt-4 pb-2 px-4">
                  {!mounted ? (
                    <div className="w-full h-[40px] bg-zinc-200 dark:bg-white/5 rounded-sm animate-pulse" />
                  ) : isConnected ? (
                    user ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 px-0 py-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                          <span className="text-[11px] font-bold tracking-tight uppercase text-zinc-700 dark:text-zinc-300">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                          </span>
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setMobileOpen(false)}
                          className="px-4 py-3 text-[11px] font-bold tracking-[0.15em] uppercase text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.03] rounded-sm transition-colors"
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => { logout(); disconnect(); setMobileOpen(false); }}
                          className="text-left px-4 py-3 text-[11px] font-bold tracking-[0.15em] uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-sm transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => { login(); setMobileOpen(false); }}
                        disabled={isSigning}
                        className="w-full px-5 py-2 bg-indigo-500 text-zinc-900 dark:text-white font-bold text-[11px] tracking-[0.1em] rounded-sm hover:bg-indigo-600 transition-colors uppercase disabled:opacity-50"
                      >
                        {isSigning ? "SIGNING..." : "SIGN IN TO GOVERN"}
                      </Button>
                    )
                  ) : (
                    <div className="flex justify-center">
                      <appkit-button />
                    </div>
                  )}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
