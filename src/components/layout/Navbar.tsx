import { Button } from "@/components/ui/button";
import { Wallet, Bot } from "lucide-react";
import { useConnect, useAccount, useDisconnect } from "wagmi";

import { Link } from "@tanstack/react-router";

export function Navbar() {
  const { connect, connectors, error } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    if (!connectors || connectors.length === 0) {
      alert(
        "No wallet extensions found! Please ensure MetaMask is installed and unlocked in your browser.",
      );
      return;
    }

    // Prefer the injected connector as it's the most reliable for browser extensions
    const connector =
      connectors.find((c) => c.id === "injected" || c.id === "metaMask") ||
      connectors[0];

    if (connector) {
      connect(
        { connector },
        {
          onError: (err) => alert("Connection failed: " + err.message),
        },
      );
    } else {
      alert("Failed to find a compatible connector.");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-zinc-100 flex items-center justify-center">
            <Bot className="h-4 w-4 text-zinc-950" />
          </div>
          <span className="font-semibold tracking-tight text-zinc-100">
            AutoSub
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
          <a href="#" className="hover:text-zinc-100 transition-colors">
            Features
          </a>
          {isConnected && (
            <Link
              to="/dashboard"
              className="hover:text-zinc-100 transition-colors"
            >
              Dashboard
            </Link>
          )}
          {isConnected ? (
            <Button
              variant="outline"
              className="border-zinc-800 bg-transparent text-zinc-100 hover:bg-zinc-900 hover:text-zinc-100 font-mono text-xs"
              onClick={() => disconnect()}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Button>
          ) : (
            <div className="flex flex-col items-end">
              <Button
                variant="outline"
                className="border-zinc-800 bg-transparent text-zinc-100 hover:bg-zinc-900 hover:text-zinc-100"
                onClick={handleConnect}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
              {error && (
                <span className="text-red-500 text-xs mt-1 absolute top-14">
                  {error.message}
                </span>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
