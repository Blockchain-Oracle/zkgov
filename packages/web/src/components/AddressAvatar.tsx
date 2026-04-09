'use client';

import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { identicon } from '@dicebear/collection';

/**
 * Generates a unique identicon SVG from a wallet address.
 * Deterministic — same address always produces same image.
 */
export function AddressAvatar({ address, size = 40, className }: { address: string; size?: number; className?: string }) {
  const svg = useMemo(() => {
    const avatar = createAvatar(identicon, {
      seed: address.toLowerCase(),
      size,
      backgroundColor: ['0a0a0a'],
    });
    return avatar.toDataUri();
  }, [address, size]);

  return (
    <img
      src={svg}
      alt={`Avatar for ${address.slice(0, 6)}...${address.slice(-4)}`}
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: '4px' }}
    />
  );
}
