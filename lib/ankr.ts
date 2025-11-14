import { createPublicClient, http, type PublicClient } from 'viem';
import { mainnet, base, optimism, arbitrum, polygon, avalanche, bsc, filecoin } from 'viem/chains';

/**
 * Get Ankr RPC URL with API key
 */
export function getAnkrRpcUrl(endpoint: string, apiKey: string): string {
  // Ankr RPC URLs format: https://rpc.ankr.com/{chain}/{api_key}
  const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  return `${baseUrl}/${apiKey}`;
}

/**
 * Create a viem public client for Ethereum mainnet using Ankr RPC
 */
export function createAnkrEthClient(apiKey: string): PublicClient {
  return createPublicClient({
    chain: mainnet,
    transport: http(getAnkrRpcUrl('https://rpc.ankr.com/eth', apiKey)),
  });
}

/**
 * Create a viem public client for Base using Ankr RPC
 */
export function createAnkrBaseClient(apiKey: string): PublicClient {
  return createPublicClient({
    chain: base,
    transport: http(getAnkrRpcUrl('https://rpc.ankr.com/base', apiKey)),
  });
}

/**
 * Create a viem public client for Optimism using Ankr RPC
 */
export function createAnkrOptimismClient(apiKey: string): PublicClient {
  return createPublicClient({
    chain: optimism,
    transport: http(getAnkrRpcUrl('https://rpc.ankr.com/optimism', apiKey)),
  });
}

/**
 * Create a viem public client for Arbitrum using Ankr RPC
 */
export function createAnkrArbitrumClient(apiKey: string): PublicClient {
  return createPublicClient({
    chain: arbitrum,
    transport: http(getAnkrRpcUrl('https://rpc.ankr.com/arbitrum', apiKey)),
  });
}

/**
 * Create a viem public client for Polygon using Ankr RPC
 */
export function createAnkrPolygonClient(apiKey: string): PublicClient {
  return createPublicClient({
    chain: polygon,
    transport: http(getAnkrRpcUrl('https://rpc.ankr.com/polygon', apiKey)),
  });
}

/**
 * Create a viem public client for Avalanche using Ankr RPC
 */
export function createAnkrAvalancheClient(apiKey: string): PublicClient {
  return createPublicClient({
    chain: avalanche,
    transport: http(getAnkrRpcUrl('https://rpc.ankr.com/avalanche', apiKey)),
  });
}

/**
 * Create a viem public client for BSC using Ankr RPC
 */
export function createAnkrBscClient(apiKey: string): PublicClient {
  return createPublicClient({
    chain: bsc,
    transport: http(getAnkrRpcUrl('https://rpc.ankr.com/bsc', apiKey)),
  });
}

/**
 * Create a viem public client for Filecoin mainnet using Ankr RPC
 */
export function createAnkrFilecoinClient(apiKey: string): PublicClient {
  return createPublicClient({
    chain: filecoin,
    transport: http(getAnkrRpcUrl('https://rpc.ankr.com/filecoin', apiKey)),
  });
}

/**
 * Create a map of chain clients for easy access
 */
export function createAnkrClients(apiKey: string): Record<string, PublicClient> {
  return {
    eth: createAnkrEthClient(apiKey),
    base: createAnkrBaseClient(apiKey),
    optimism: createAnkrOptimismClient(apiKey),
    arbitrum: createAnkrArbitrumClient(apiKey),
    polygon: createAnkrPolygonClient(apiKey),
    avalanche: createAnkrAvalancheClient(apiKey),
    bsc: createAnkrBscClient(apiKey),
    filecoin: createAnkrFilecoinClient(apiKey),
  };
}

