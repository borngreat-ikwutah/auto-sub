import { createConfig, http } from 'wagmi'
import { arbitrum, arbitrumSepolia } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// Fallback WalletConnect project ID or user's project ID if provided
const projectId = '8bc7a61d1de4552b04c86bfcfcd27118' // A public test project ID for demonstration

export const config = createConfig({
  chains: [arbitrum, arbitrumSepolia],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }),
  ],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
