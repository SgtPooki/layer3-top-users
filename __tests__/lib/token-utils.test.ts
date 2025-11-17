/**
 * Unit tests for token utility functions
 *
 * These tests demonstrate:
 * - Pure function testing
 * - Edge case handling
 * - Type safety validation
 */

import { describe, it, expect } from 'vitest';
import {
  formatBalance,
  formatDate,
  isTopToken,
  isStablecoin,
  isNativeToken,
} from '@/lib/token-utils';
import type { TokenBalance } from '@/lib/wallet';

describe('formatBalance', () => {
  it('formats valid balance with proper decimals', () => {
    expect(formatBalance('1234.567890123')).toBe('1,234.56789');
  });

  it('handles small decimals correctly', () => {
    expect(formatBalance('0.000001')).toBe('0.000001');
  });

  it('returns zero for invalid input', () => {
    expect(formatBalance('invalid')).toBe('0');
    expect(formatBalance('')).toBe('0');
  });

  it('handles zero balance', () => {
    expect(formatBalance('0')).toBe('0');
  });
});

describe('formatDate', () => {
  it('formats Unix timestamp correctly', () => {
    const timestamp = 1640000000; // Dec 20, 2021
    const result = formatDate(timestamp);
    expect(result).toContain('2021');
    expect(result).toContain('Dec');
  });
});

describe('isTopToken', () => {
  it('identifies ETH on Ethereum as top token', () => {
    const ethBalance: TokenBalance = {
      blockchain: 'ethereum',
      tokenSymbol: 'ETH',
      tokenName: 'Ethereum',
      tokenDecimals: 18,
      tokenType: 'NATIVE',
      contractAddress: null,
      holderAddress: '0x123',
      balance: '1.5',
      balanceRawInteger: '1500000000000000000',
      balanceUsd: '3000',
      tokenPrice: '2000',
    };
    expect(isTopToken(ethBalance)).toBe(true);
  });

  it('identifies USDC on Base as top token', () => {
    const usdcBalance: TokenBalance = {
      blockchain: 'base',
      tokenSymbol: 'USDC',
      tokenName: 'USD Coin',
      tokenDecimals: 6,
      tokenType: 'ERC20',
      contractAddress: '0xabc',
      holderAddress: '0x123',
      balance: '100',
      balanceRawInteger: '100000000',
      balanceUsd: '100',
      tokenPrice: '1',
    };
    expect(isTopToken(usdcBalance)).toBe(true);
  });

  it('returns false for non-top tokens', () => {
    const randomToken: TokenBalance = {
      blockchain: 'ethereum',
      tokenSymbol: 'RANDOM',
      tokenName: 'Random Token',
      tokenDecimals: 18,
      tokenType: 'ERC20',
      contractAddress: '0xdef',
      holderAddress: '0x123',
      balance: '100',
      balanceRawInteger: '100000000000000000000',
      balanceUsd: '50',
      tokenPrice: '0.5',
    };
    expect(isTopToken(randomToken)).toBe(false);
  });
});

describe('isStablecoin', () => {
  it('identifies common stablecoins', () => {
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD'];
    stablecoins.forEach((symbol) => {
      const token: TokenBalance = {
        blockchain: 'ethereum',
        tokenSymbol: symbol,
        tokenName: symbol,
        tokenDecimals: 6,
        tokenType: 'ERC20',
        contractAddress: '0xabc',
        holderAddress: '0x123',
        balance: '100',
        balanceRawInteger: '100000000',
        balanceUsd: '100',
        tokenPrice: '1',
      };
      expect(isStablecoin(token)).toBe(true);
    });
  });

  it('returns false for non-stablecoins', () => {
    const ethToken: TokenBalance = {
      blockchain: 'ethereum',
      tokenSymbol: 'ETH',
      tokenName: 'Ethereum',
      tokenDecimals: 18,
      tokenType: 'NATIVE',
      contractAddress: null,
      holderAddress: '0x123',
      balance: '1',
      balanceRawInteger: '1000000000000000000',
      balanceUsd: '2000',
      tokenPrice: '2000',
    };
    expect(isStablecoin(ethToken)).toBe(false);
  });
});

describe('isNativeToken', () => {
  it('identifies ETH on Ethereum as native', () => {
    const ethToken: TokenBalance = {
      blockchain: 'ethereum',
      tokenSymbol: 'ETH',
      tokenName: 'Ethereum',
      tokenDecimals: 18,
      tokenType: 'NATIVE',
      contractAddress: null,
      holderAddress: '0x123',
      balance: '1',
      balanceRawInteger: '1000000000000000000',
      balanceUsd: '2000',
      tokenPrice: '2000',
    };
    expect(isNativeToken(ethToken)).toBe(true);
  });

  it('identifies MATIC on Polygon as native', () => {
    const maticToken: TokenBalance = {
      blockchain: 'polygon',
      tokenSymbol: 'MATIC',
      tokenName: 'Polygon',
      tokenDecimals: 18,
      tokenType: 'NATIVE',
      contractAddress: null,
      holderAddress: '0x123',
      balance: '100',
      balanceRawInteger: '100000000000000000000',
      balanceUsd: '50',
      tokenPrice: '0.5',
    };
    expect(isNativeToken(maticToken)).toBe(true);
  });

  it('returns false for ERC20 tokens', () => {
    const erc20Token: TokenBalance = {
      blockchain: 'ethereum',
      tokenSymbol: 'USDC',
      tokenName: 'USD Coin',
      tokenDecimals: 6,
      tokenType: 'ERC20',
      contractAddress: '0xabc',
      holderAddress: '0x123',
      balance: '100',
      balanceRawInteger: '100000000',
      balanceUsd: '100',
      tokenPrice: '1',
    };
    expect(isNativeToken(erc20Token)).toBe(false);
  });
});
