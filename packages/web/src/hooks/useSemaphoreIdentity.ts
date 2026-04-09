'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { Identity } from '@semaphore-protocol/core';

const STORAGE_KEY = 'zkgov-semaphore-identity';
const SIGN_MESSAGE = 'ZKGov Semaphore Identity v1 - Sign to derive your anonymous voter identity';

/**
 * Manages the user's Semaphore identity.
 *
 * The identity is derived deterministically from a wallet signature:
 * - User signs a fixed message → signature becomes the seed
 * - Same wallet always produces the same identity (recoverable)
 * - Identity stored in localStorage as a cache
 *
 * The identity commitment (public part) is what gets registered on-chain.
 * The private key generates ZK proofs for anonymous voting.
 */
export function useSemaphoreIdentity() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Load cached identity from localStorage
  useEffect(() => {
    if (!address) return;
    const cached = localStorage.getItem(`${STORAGE_KEY}-${address}`);
    if (cached) {
      try {
        const id = new Identity(cached);
        setIdentity(id);
      } catch {
        localStorage.removeItem(`${STORAGE_KEY}-${address}`);
      }
    }
  }, [address]);

  // Create or recover identity by signing a message
  const createIdentity = useCallback(async () => {
    if (!isConnected || !address) throw new Error('Wallet not connected');
    setIsCreating(true);

    try {
      // Sign a deterministic message — same wallet = same signature = same identity
      const signature = await signMessageAsync({ message: SIGN_MESSAGE });

      // Use the signature as the seed for the Semaphore identity
      const id = new Identity(signature);

      // Cache in localStorage
      localStorage.setItem(`${STORAGE_KEY}-${address}`, signature);
      setIdentity(id);

      return id;
    } finally {
      setIsCreating(false);
    }
  }, [isConnected, address, signMessageAsync]);

  return {
    identity,
    commitment: identity?.commitment?.toString() || null,
    isCreating,
    createIdentity,
    hasIdentity: !!identity,
  };
}
