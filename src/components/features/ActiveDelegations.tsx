import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDelegations } from "@/server/delegations";
import { useAccount } from "wagmi";

export function ActiveDelegations() {
  const { address } = useAccount();

  const { data: delegations, isLoading } = useQuery({
    queryKey: ['delegations', address],
    queryFn: async () => {
      if (!address) return [];
      return getDelegations({ data: address });
    },
    enabled: !!address,
    refetchInterval: 5000, // Fetch every 5 seconds to instantly reflect new delegations
  });

  return (
    <Card className="col-span-1 lg:col-span-7 border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden p-6 flex flex-col h-[500px]">
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
          <History className="h-5 w-5 text-zinc-400" />
          Active Delegations
        </h3>
      </div>

      <div className="border border-zinc-900 rounded-lg overflow-x-auto flex-1 min-h-0">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-900 font-medium sticky top-0">
            <tr>
              <th className="px-4 py-3 font-normal">Recipient</th>
              <th className="px-4 py-3 font-normal">Amount</th>
              <th className="px-4 py-3 font-normal">Frequency</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal text-right">Next Run</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-zinc-300">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-zinc-400" />
                  Loading active delegations...
                </td>
              </tr>
            ) : delegations?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                  No active delegations found.
                </td>
              </tr>
            ) : (
              delegations?.map((del) => (
                <tr key={del.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-100">
                    {del.recipientAddress.length > 20 
                      ? `${del.recipientAddress.slice(0, 6)}...${del.recipientAddress.slice(-4)}`
                      : del.recipientAddress}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {(Number(del.amount) / 10**6).toFixed(2)} USDC
                  </td>
                  <td className="px-4 py-3">
                    {del.intervalSeconds === 604800 ? "Weekly" : "Recurring"}
                  </td>
                  <td className="px-4 py-3">
                    {del.isActive ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-0 rounded-sm font-normal text-xs px-2 py-0.5">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-800 text-zinc-400 hover:bg-zinc-800 border-0 rounded-sm font-normal text-xs px-2 py-0.5">
                        Paused
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-zinc-500">
                    {new Date(del.nextRunTime).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
