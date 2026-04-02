'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/constants';
import { Shield, CheckCircle2, Loader2, Wallet, AlertCircle } from 'lucide-react';

type Step = 'connect' | 'verifying' | 'registering' | 'done' | 'error';

export default function TelegramRegisterPage() {
  const [step, setStep] = useState<Step>('connect');
  const [error, setError] = useState('');

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, []);

  const startRegistration = async () => {
    setStep('verifying');
    setError('');

    try {
      // In a real implementation, this would:
      // 1. Connect wallet via Reown AppKit (works in Telegram WebView)
      // 2. Sign a message to register
      // 3. Check KYC SBT
      // 4. Register on-chain
      // 5. Link Telegram ID via initData

      // For demo, simulate the flow
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';

      // Step 1: Simulate wallet connection + registration
      setStep('registering');

      // This is where the actual wallet connection would happen
      // AppKit's modal works inside Telegram WebView
      await new Promise(resolve => setTimeout(resolve, 1500));

      setStep('done');

      // Auto-close after 3 seconds
      setTimeout(() => {
        if (tg) tg.close();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setStep('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
      {step === 'connect' && (
        <>
          <Shield className="w-16 h-16 text-indigo-400 mb-6" />
          <h1 className="text-xl font-bold text-white mb-2">
            Welcome to ZKGov
          </h1>
          <p className="text-zinc-500 text-sm mb-8 max-w-[280px]">
            Connect your wallet to start voting anonymously with zero-knowledge proofs.
          </p>
          <button
            onClick={startRegistration}
            className="w-full max-w-[280px] py-4 rounded-sm bg-indigo-500 text-white font-bold text-sm tracking-wider uppercase transition-all active:scale-[0.97] hover:bg-indigo-600 flex items-center justify-center gap-2"
          >
            <Wallet size={16} />
            Connect Wallet
          </button>
          <p className="text-[10px] text-zinc-700 mt-4 tracking-wider uppercase">
            HashKey Chain Testnet · Chain ID 133
          </p>
        </>
      )}

      {step === 'verifying' && (
        <>
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
          <h1 className="text-lg font-bold text-white mb-2">Checking KYC Status</h1>
          <p className="text-zinc-500 text-sm">
            Verifying your identity on HashKey Chain...
          </p>
        </>
      )}

      {step === 'registering' && (
        <>
          <div className="relative mb-4">
            <Shield className="w-12 h-12 text-indigo-400" />
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin absolute -bottom-1 -right-1" />
          </div>
          <h1 className="text-lg font-bold text-white mb-2">Creating Voter Identity</h1>
          <p className="text-zinc-500 text-sm max-w-[280px]">
            Generating your anonymous Semaphore identity. This only happens once.
          </p>
        </>
      )}

      {step === 'done' && (
        <>
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">You&apos;re Registered</h1>
          <p className="text-zinc-500 text-sm max-w-[280px]">
            Your votes are now private and verified. Close this and tap Vote Now in the group.
          </p>
        </>
      )}

      {step === 'error' && (
        <>
          <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
          <h1 className="text-lg font-bold text-white mb-2">Registration Failed</h1>
          <p className="text-rose-400/80 text-sm mb-6">{error}</p>
          <button
            onClick={() => { setStep('connect'); setError(''); }}
            className="px-6 py-3 rounded-sm border border-white/10 text-white text-sm font-bold tracking-wider uppercase"
          >
            Try Again
          </button>
        </>
      )}
    </div>
  );
}
