'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useSignMessage } from 'wagmi';
import { API_URL } from '@/lib/constants';
import { Shield, CheckCircle2, Loader2, Wallet, AlertCircle } from 'lucide-react';

/**
 * Telegram Mini App Registration Flow
 *
 * This page handles first-time user registration inside Telegram's WebView.
 * Flow: Connect wallet (via Reown AppKit) → Sign message → Create account → Link Telegram → Return to vote
 *
 * Key constraints:
 * - Reown AppKit works in Telegram WebView via social login / embedded wallets
 * - External wallet deep links (MetaMask) do NOT work on Android WebView
 * - We use inline keyboard buttons in groups, so sendData() is NOT available
 * - All communication goes through our backend API via fetch()
 */

type Step = 'connect' | 'signing' | 'registering' | 'linking' | 'done' | 'error';

export default function TelegramRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F2EB] dark:bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>}>
      <TelegramRegisterContent />
    </Suspense>
  );
}

function TelegramRegisterContent() {
  const [step, setStep] = useState<Step>('connect');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Initialize Telegram WebApp
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, []);

  // Auto-advance when wallet connects
  useEffect(() => {
    if (isConnected && address && step === 'connect') {
      handleRegistration();
    }
  }, [isConnected, address]);

  const handleRegistration = async () => {
    if (!address) return;
    const tg = (window as any).Telegram?.WebApp;
    const initData = tg?.initData || '';

    try {
      // Step 1: Sign message to prove wallet ownership
      setStep('signing');
      const nonce = `tg-register-${Date.now()}`;
      const message = `Sign in to ZKGov: ${nonce}`;
      const signature = await signMessageAsync({ message });

      // Step 2: Register with backend
      setStep('registering');
      const regRes = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, signature, nonce }),
      });

      if (!regRes.ok) {
        const data = await regRes.json();
        throw new Error(data.error || 'Registration failed');
      }

      const { token } = await regRes.json();

      // Step 3: Link Telegram account
      if (initData && token) {
        setStep('linking');
        await fetch(`${API_URL}/api/auth/link/telegram`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ initData }),
        });
      }

      // Store token for the vote page
      if (typeof window !== 'undefined') {
        localStorage.setItem('zkgov_token', token);
      }

      setStep('done');

      // Return to vote page after 2 seconds
      setTimeout(() => {
        if (returnTo) {
          router.push(returnTo);
        } else {
          tg?.close();
        }
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setStep('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
      {step === 'connect' && (
        <>
          <Shield className="w-16 h-16 text-indigo-400 mb-6" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            Welcome to ZKGov
          </h1>
          <p className="text-zinc-500 text-sm mb-8 max-w-[280px]">
            Connect your wallet to start voting anonymously with zero-knowledge proofs.
          </p>
          {/* Reown AppKit button — works in Telegram WebView via social login */}
          <div className="w-full max-w-[280px]">
            <appkit-button />
          </div>
          <p className="text-[10px] text-zinc-600 mt-4 tracking-wider uppercase">
            HashKey Chain Testnet
          </p>
        </>
      )}

      {step === 'signing' && (
        <>
          <Wallet className="w-12 h-12 text-indigo-400 mb-4" />
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mb-4" />
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Sign Message</h1>
          <p className="text-zinc-500 text-sm">
            Approve the signature request in your wallet...
          </p>
        </>
      )}

      {step === 'registering' && (
        <>
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Creating Account</h1>
          <p className="text-zinc-500 text-sm max-w-[280px]">
            Generating your anonymous Semaphore identity...
          </p>
        </>
      )}

      {step === 'linking' && (
        <>
          <div className="relative mb-4">
            <Shield className="w-12 h-12 text-indigo-400" />
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin absolute -bottom-1 -right-1" />
          </div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Linking Telegram</h1>
          <p className="text-zinc-500 text-sm max-w-[280px]">
            Connecting your Telegram account so you can vote from chat...
          </p>
        </>
      )}

      {step === 'done' && (
        <>
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">You're Registered</h1>
          <p className="text-zinc-500 text-sm max-w-[280px]">
            {returnTo
              ? "Taking you back to vote..."
              : "Your votes are now private and verified. Close this and tap Vote Now."}
          </p>
        </>
      )}

      {step === 'error' && (
        <>
          <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Something Went Wrong</h1>
          <p className="text-rose-400/80 text-sm mb-6">{error}</p>
          <button
            onClick={() => { setStep('connect'); setError(''); }}
            className="px-6 py-3 rounded-sm border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white text-sm font-bold tracking-wider uppercase"
          >
            Try Again
          </button>
        </>
      )}
    </div>
  );
}
