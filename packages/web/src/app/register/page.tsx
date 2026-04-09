'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { useWriteContract } from 'wagmi';
import { API_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Shield, CheckCircle2, Loader2, Wallet, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Step = 'connect' | 'sign' | 'kyc' | 'register' | 'done';

export default function RegisterPage() {
  const { user, token, login, isSigning } = useAuth();
  const { isConnected, address } = useAccount();
  const { writeContract } = useWriteContract();
  const [step, setStep] = useState<Step>('kyc'); // Start at KYC — connect/sign handled by auto-advance
  const [error, setError] = useState('');
  const [kycLevel, setKycLevel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Auto-advance steps based on state (only after client mount to avoid hydration mismatch)
  const currentStep = !mounted ? 'connect' : !isConnected ? 'connect' : !user ? 'sign' : step;

  const verifyKyc = async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'KYC verification failed');
        return;
      }

      setKycLevel(data.kycLevel);
      setStep('register');

      // Register on-chain
      if (data.registration) {
        writeContract({
          address: data.registration.contractAddress,
          abi: [{
            name: 'registerHuman',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [{ name: 'identityCommitment', type: 'uint256' }],
            outputs: []
          }],
          functionName: 'registerHuman',
          args: [BigInt(data.registration.args[0])],
        });
      }

      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 'connect', label: 'Connect Wallet', icon: Wallet },
    { id: 'sign', label: 'Sign In', icon: Shield },
    { id: 'kyc', label: 'Verify KYC', icon: CheckCircle2 },
    { id: 'register', label: 'Register', icon: Shield },
    { id: 'done', label: 'Done', icon: CheckCircle2 },
  ];

  const stepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="max-w-lg mx-auto py-20 px-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-12">
        {steps.slice(0, 4).map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-sm flex items-center justify-center text-[11px] font-bold transition-colors",
              i < stepIndex ? "bg-emerald-500/20 text-emerald-400" :
              i === stepIndex ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" :
              "bg-white/5 text-zinc-600"
            )}>
              {i < stepIndex ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            {i < 3 && <div className={cn("w-8 h-px", i < stepIndex ? "bg-emerald-500/30" : "bg-white/10")} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      {currentStep === 'connect' && (
        <div className="text-center">
          <Wallet className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3 tracking-tight">Connect Your Wallet</h1>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            Connect your wallet to HashKey Chain Testnet (Chain ID 133) to get started.
          </p>
          <div className="flex justify-center">
            <appkit-button />
          </div>
        </div>
      )}

      {currentStep === 'sign' && (
        <div className="text-center">
          <Shield className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3 tracking-tight">Sign In to ZKGov</h1>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            Sign a message to create your account. This creates your anonymous voter identity.
          </p>
          <button
            onClick={login}
            disabled={isSigning}
            className="px-8 py-3 bg-indigo-500 text-zinc-900 dark:text-white font-bold text-sm tracking-wider uppercase rounded-sm hover:bg-indigo-600 transition-colors disabled:opacity-50"
          >
            {isSigning ? 'SIGNING...' : 'SIGN MESSAGE'}
          </button>
        </div>
      )}

      {currentStep === 'kyc' && (
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3 tracking-tight">Verify KYC Status</h1>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            We'll check if your wallet has a KYC SBT on HashKey Chain. This is required to vote on verified proposals.
          </p>
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={verifyKyc}
              disabled={isLoading}
              className="px-8 py-3 bg-indigo-500 text-zinc-900 dark:text-white font-bold text-sm tracking-wider uppercase rounded-sm hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              {isLoading ? 'CHECKING...' : 'VERIFY ON-CHAIN KYC'}
            </button>
            <span className="text-zinc-500 text-xs">or</span>
            <button
              onClick={async () => {
                if (!token) return;
                setIsLoading(true);
                setError('');
                try {
                  const res = await fetch(`${API_URL}/api/auth/demo-verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  });
                  const data = await res.json();
                  if (res.ok) { setKycLevel(data.kycLevel); setStep('done'); }
                  else throw new Error(data.error);
                } catch (err: any) { setError(err.message); }
                finally { setIsLoading(false); }
              }}
              disabled={isLoading}
              className="px-8 py-3 border border-zinc-300 dark:border-white/10 text-zinc-600 dark:text-zinc-400 font-bold text-sm tracking-wider uppercase rounded-sm hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              DEMO VERIFY (HACKATHON)
            </button>
          </div>
          {error && (
            <div className="mt-6 flex items-center gap-2 text-rose-400 text-xs justify-center">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {currentStep === 'done' && (
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3 tracking-tight">You're Registered</h1>
          <p className="text-zinc-500 text-sm mb-2 leading-relaxed">
            KYC Level: <span className="text-emerald-400 font-bold">{kycLevel || 'VERIFIED'}</span>
          </p>
          <p className="text-zinc-600 text-xs mb-8">
            Your votes are now private and verified via zero-knowledge proofs.
          </p>
          <Link
            href="/proposals"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-bold text-sm tracking-wider uppercase rounded-sm hover:bg-zinc-200 transition-colors"
          >
            VIEW PROPOSALS <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
