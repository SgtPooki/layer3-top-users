/**
 * Unit tests for blockchain explorer utilities
 *
 * Demonstrates testing of:
 * - String manipulation and formatting
 * - Multiple input variations
 * - Null handling
 */

import { describe, it, expect } from 'vitest';
import { getExplorerUrl, formatChainName } from '@/lib/explorers';

describe('getExplorerUrl', () => {
  it('generates correct Etherscan URL for ethereum', () => {
    const hash = '0x1234567890abcdef';
    expect(getExplorerUrl('ethereum', hash)).toBe(`https://etherscan.io/tx/${hash}`);
    expect(getExplorerUrl('eth', hash)).toBe(`https://etherscan.io/tx/${hash}`);
    expect(getExplorerUrl('1', hash)).toBe(`https://etherscan.io/tx/${hash}`);
  });

  it('generates correct Basescan URL', () => {
    const hash = '0xabcdef1234567890';
    expect(getExplorerUrl('base', hash)).toBe(`https://basescan.org/tx/${hash}`);
  });

  it('generates correct Polygonscan URL', () => {
    const hash = '0xfedcba0987654321';
    expect(getExplorerUrl('polygon', hash)).toBe(`https://polygonscan.com/tx/${hash}`);
    expect(getExplorerUrl('137', hash)).toBe(`https://polygonscan.com/tx/${hash}`);
  });

  it('returns null for unsupported chains', () => {
    expect(getExplorerUrl('unknown-chain', '0x123')).toBeNull();
  });

  it('handles case-insensitive chain names', () => {
    const hash = '0x123';
    expect(getExplorerUrl('ETHEREUM', hash)).toBe(`https://etherscan.io/tx/${hash}`);
    expect(getExplorerUrl('Polygon', hash)).toBe(`https://polygonscan.com/tx/${hash}`);
  });

  it('handles partial matches', () => {
    const hash = '0x456';
    expect(getExplorerUrl('ethereum-mainnet', hash)).toBe(`https://etherscan.io/tx/${hash}`);
    expect(getExplorerUrl('polygon-pos', hash)).toBe(`https://polygonscan.com/tx/${hash}`);
  });
});

describe('formatChainName', () => {
  it('formats known chain identifiers correctly', () => {
    expect(formatChainName('eth')).toBe('Ethereum');
    expect(formatChainName('ethereum')).toBe('Ethereum');
    expect(formatChainName('polygon')).toBe('Polygon');
    expect(formatChainName('base')).toBe('Base');
    expect(formatChainName('bsc')).toBe('BNB Smart Chain');
  });

  it('handles case-insensitive input', () => {
    expect(formatChainName('ETH')).toBe('Ethereum');
    expect(formatChainName('POLYGON')).toBe('Polygon');
  });

  it('handles partial matches', () => {
    expect(formatChainName('ethereum-mainnet')).toBe('Ethereum');
    expect(formatChainName('polygon-pos')).toBe('Polygon');
  });

  it('capitalizes unknown chain names', () => {
    expect(formatChainName('some-unknown-chain')).toBe('Some Unknown Chain');
    expect(formatChainName('my_custom_chain')).toBe('My Custom Chain');
  });
});
