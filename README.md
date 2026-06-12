# 🦋 OwoAgent

OwoAgent is a state-of-the-art, full-stack Web3 application boilerplate built on the **Arbitrum** network. It merges a modern, highly optimized decentralized frontend with robust smart contract infrastructure. 

The user interface features a custom **Bluesky-Inspired Design System**, styled with **Tailwind CSS v4** and **shadcn/ui**, delivering a clean, approachable, and responsive user experience with smooth micro-animations, accessible contrast ratios, and complete light/dark theme modes.

---

## 🚀 Core Features

### 💻 Modern Frontend Stack
*   **Vite + React 19 + TypeScript**: Lightning-fast Hot Module Replacement (HMR) and strict type-safety.
*   **TanStack Router & Query**: Declarative type-safe routing, efficient global state, and server-cache management.
*   **Tailwind CSS v4 + tw-animate-css**: Dynamic styling with modern CSS variables and smooth transitions.
*   **shadcn/ui (Radix Nova Style)**: Highly accessible, themeable, unstyled Radix primitives preconfigured for OwoAgent.
*   **Next Themes**: Native system-aware Light & Dark mode support.

### ⛓️ Web3 & Smart Contracts
*   **Arbitrum Native**: Preconfigured for Arbitrum One (mainnet) and Arbitrum Sepolia (testnet).
*   **Hardhat Framework**: Complete Ethereum development environment for compiling, testing, and deploying Solidity smart contracts.
*   **Wagmi & Viem**: Type-safe React hooks for Ethereum, supporting Injected wallets, MetaMask, and WalletConnect.
*   **Solidity 0.8.28**: Smart contract compiler featuring standard optimizer configuration.

### 🎨 Bluesky-Inspired Design System
The visual atmosphere leverages a serene, premium aesthetic focusing on human connection and control:
*   **Color Palette**: Sky Blue (`#006AFF`) accents, Slate Grays for secondary information, and Off-White/Deep Navy surfaces.
*   **Border Radius**: Generous soft rounded forms (`--radius: 0.75rem`) for a friendly and modern feel.
*   **Typography**: Clean, readable sans-serif hierarchy powered by the *Geist Variable* typeface.
*   **Depth & Elevation**: Soft, multi-level shadows (Levels 1–3) providing depth without visual heaviness.

---

## 📂 Repository Structure

```filepath
├── contracts/               # Solidity Smart Contracts (Hardhat)
│   └── Lock.sol             # Example time-locked wallet contract
├── test/                    # Smart Contract Unit Tests
│   └── Lock.cjs             # Chai/Mocha tests for Lock.sol
├── src/                     # React App Source Code
│   ├── components/          # Reusable React components
│   │   └── ui/              # shadcn/ui components (button, card, dialog, etc.)
│   ├── features/            # Feature-based modular components
│   ├── lib/                 # Core utility and helper functions
│   ├── routes/              # TanStack Router folder-based routing
│   │   ├── __root.tsx       # Root layout, providers, and devtools
│   │   └── index.tsx        # Dashboard / Landing page
│   ├── index.css            # Tailwind directives and theme variables
│   ├── main.tsx             # App entrypoint and Wagmi/Query providers
│   └── wagmi.ts             # Web3 client configuration (Connectors, RPCs)
├── hardhat.config.cjs       # Hardhat configurations and network setups
├── vite.config.ts           # Vite + TanStack Router plugin configuration
└── package.json             # Core dependencies and scripts
```

---

## 🛠️ Getting Started

### 📋 Prerequisites
Ensure you have [Bun](https://bun.sh/) installed on your machine. Bun is used as the primary package manager for maximum speed.

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone git@github.com:borngreat-ikwutah/owo-agent.git
cd owo-agent

# Install dependencies using Bun
bun install
```

### 2. Smart Contract Development
Smart contracts are managed inside the `contracts/` directory using Hardhat.

```bash
# Compile Solidity contracts
bunx hardhat compile

# Run smart contract unit tests
bunx hardhat test

# Spin up a local Hardhat node
bunx hardhat node
```

To deploy contracts to Arbitrum, configure your `.env` or system environment with your `PRIVATE_KEY` and run:
```bash
# Deploy to Arbitrum Sepolia
bunx hardhat run ignition/deploy.js --network arbitrumSepolia

# Deploy to Arbitrum One (Mainnet)
bunx hardhat run ignition/deploy.js --network arbitrumOne
```

### 3. Frontend Web Application
Run the Vite development server with hot reload:

```bash
# Run local dev server
bun run dev

# Lint code using ESLint
bun run lint

# Build the production bundle
bun run build

# Preview the production build locally
bun run preview
```

---

## 📘 Design System Specifications

OwoAgent adheres strictly to the design principles defined in [design.md](file:///home/borngreat/Desktop/arbitrum-project/design.md). Below is a quick color and layout reference:

### Palette & HSL Tokens
| Token | HEX | Role / Usage |
| :--- | :--- | :--- |
| **Primary Blue** | `#006AFF` | Primary CTAs, brand accent, active link states |
| **Slate Blue** | `#667B99` | Secondary actions, inactive states, secondary text |
| **Darker Slate** | `#405168` | Hover/focus states, neutral dark borders |
| **Off-White** | `#F9FAFB` | Light surface/card background colors |
| **Deep Navy** | `#151D28` | Dark mode base background color |

### Elevation Levels
*   **Level 1 (Subtle)**: `0 1px 3px rgba(0, 0, 0, 0.08)` (Default cards)
*   **Level 2 (Elevated)**: `0 4px 12px rgba(0, 0, 0, 0.12)` (Popovers, hover cards)
*   **Level 3 (Modal)**: `0 8px 20px rgba(0, 0, 0, 0.15)` (Modals and dropdown menus)
*   **Interactive Ring**: `0 0 0 3px rgba(0, 106, 255, 0.1)` (Input & Button focus indicator)

---

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request. Make sure to run `bun run lint` and verify contract tests pass using `bunx hardhat test` before creating your pull request.

## 📄 License
This project is licensed under the **UNLICENSED** (all rights reserved) / MIT license. Refer to [Lock.sol](file:///home/borngreat/Desktop/arbitrum-project/contracts/Lock.sol) for license comments.
