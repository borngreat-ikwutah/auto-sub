import { createFileRoute } from "@tanstack/react-router";
import { ChatInterface } from "@/components/features/ChatInterface";
import { ActiveDelegations } from "@/components/features/ActiveDelegations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, LogOut, LayoutDashboard, Loader2 } from "lucide-react";
import { Link, Navigate } from "@tanstack/react-router";
import { useAccount, useDisconnect } from "wagmi";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/server/delegations";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats", address],
    queryFn: async () => {
      if (!address) return { activeCount: 0, totalMonthly: "0.00", budgetUsed: "0.00", isSmartAccount: false };
      return getDashboardStats({ data: address });
    },
    enabled: !!address && mounted,
    refetchInterval: 5000,
  });

  if (!mounted) return null;
  if (!isConnected) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-dvh w-full bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-900 bg-zinc-950/50">
        <div className="flex h-16 items-center gap-2 px-6 border-b border-zinc-900">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-zinc-100 flex items-center justify-center">
              <Bot className="h-4 w-4 text-zinc-950" />
            </div>
            <span className="font-semibold tracking-tight text-zinc-100">AutoSub</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <Link
            to="/dashboard"
            className="flex items-center px-4 py-2 text-sm font-medium rounded-md bg-zinc-900 text-zinc-100"
          >
            <LayoutDashboard className="mr-3 h-4 w-4 text-zinc-400" />
            Overview
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-zinc-100 truncate">
                {address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Not connected"}
              </p>
              <p className="text-xs text-emerald-500">Connected</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
              onClick={() => disconnect()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <DashboardHeader stats={stats} isLoading={isLoading} />

        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <StatsCards stats={stats} isLoading={isLoading} />

            {/* Core Feature Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <ChatInterface />
              <ActiveDelegations />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ---- Sub-components ----

function DashboardHeader({ stats, isLoading }: { stats?: any; isLoading: boolean }) {
  const isUpgraded = stats?.isSmartAccount;

  return (
    <header className="flex h-16 items-center justify-between px-6 border-b border-zinc-900 bg-zinc-950/50">
      <h1 className="text-lg font-medium text-zinc-100">Agent Overview</h1>
      <div className="flex items-center gap-3">
        {isLoading ? (
          <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono text-xs">
            Checking Account Status...
          </Badge>
        ) : isUpgraded ? (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs flex items-center gap-1.5 px-3 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Smart Account Enabled (EIP-7702)
          </Badge>
        ) : (
          <Badge variant="outline" className="border-zinc-800 text-zinc-400 font-mono text-xs flex items-center gap-1.5 px-3 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
            Standard Account (EOA)
          </Badge>
        )}
        <Badge variant="outline" className="border-zinc-800 text-amber-500/80 border-amber-500/30 font-mono text-xs">
          Base Sepolia Testnet
        </Badge>
      </div>
    </header>
  );
}

function StatsCards({ stats, isLoading }: { stats?: any; isLoading: boolean }) {
  const statItems = [
    {
      label: "Total Monthly Budget",
      value: isLoading ? "—" : `${stats?.totalMonthly ?? "0.00"} USDC`,
    },
    {
      label: "Budget Used",
      value: isLoading ? "—" : `${stats?.budgetUsed ?? "0.00"} USDC`,
    },
    {
      label: "Active Delegations",
      value: isLoading ? "—" : String(stats?.activeCount ?? 0),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="p-5 rounded-xl border border-zinc-900 bg-zinc-950"
        >
          <p className="text-sm text-zinc-500 font-medium mb-1">{item.label}</p>
          <p className="text-2xl font-mono text-zinc-100 flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
            ) : (
              item.value
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
