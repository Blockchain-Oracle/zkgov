'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, CheckCircle2, Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Register Page
 *
 * Purpose: Connect wallet + sign in to create a ZKGov account.
 * This creates a Semaphore identity for anonymous voting.
 *
 * KYC is NOT part of registration — it's a separate optional step
 * only needed for voting on "verified" proposals.
 * KYC can be done from the Profile page.
 */

type Step = 'connect' | 'sign' | 'done';

export default function RegisterPage() {
  const { user, login, isSigning } = useAuth();
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Auto-advance: connect → sign → done
  const currentStep: Step = !mounted ? 'connect' : !isConnected ? 'connect' : !user ? 'sign' : 'done';

  const steps = [
    { id: 'connect', label: 'Connect', icon: Wallet },
    { id: 'sign', label: 'Sign In', icon: Shield },
    { id: 'done', label: 'Ready', icon: CheckCircle2 },
  ];

  const stepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="max-w-lg mx-auto py-20 px-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-12">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-sm flex items-center justify-center text-[11px] font-bold transition-colors",
              i < stepIndex ? "bg-emerald-500/20 text-emerald-400" :
              i === stepIndex ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" :
              "bg-black/5 dark:bg-white/5 text-zinc-600"
            )}>
              {i < stepIndex ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            {i < steps.length - 1 && <div className={cn("w-8 h-px", i < stepIndex ? "bg-emerald-500/30" : "bg-black/10 dark:bg-white/10")} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      {currentStep === 'connect' && (
        <Card className="p-8 text-center bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06]">
          <Wallet className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3 tracking-tight">Connect Your Wallet</h1>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            Connect to HashKey Chain Testnet to get started with anonymous governance.
          </p>
          <div className="flex justify-center">
            <appkit-button />
          </div>
        </Card>
      )}

      {currentStep === 'sign' && (
        <Card className="p-8 text-center bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06]">
          <Shield className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3 tracking-tight">Sign In to ZKGov</h1>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            Sign a message to create your anonymous voter identity. This generates a Semaphore commitment for ZK proofs.
          </p>
          <Button
            onClick={login}
            disabled={isSigning}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm tracking-wider uppercase px-8"
          >
            {isSigning ? 'SIGNING...' : 'SIGN MESSAGE'}
          </Button>
        </Card>
      )}

      {currentStep === 'done' && (
        <Card className="p-8 text-center bg-[#EBE8E1] dark:bg-[#111] border-black/[0.06] dark:border-white/[0.06]">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3 tracking-tight">You're Registered</h1>
          <p className="text-zinc-500 text-sm mb-2 leading-relaxed">
            Your anonymous voter identity has been created.
          </p>
          <p className="text-zinc-600 text-xs mb-8">
            You can now create proposals and vote on open proposals.
            To vote on verified proposals, verify your KYC from your profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/proposals">
              <Button className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm tracking-wider uppercase px-6">
                View Proposals <ArrowRight size={14} className="ml-2" />
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" className="border-black/10 dark:border-white/10 font-bold text-sm tracking-wider uppercase px-6">
                Go to Profile
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
