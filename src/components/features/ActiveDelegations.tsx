import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Loader2, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDelegations, cancelDelegation } from "@/server/delegations";
import { useAccount } from "wagmi";
import { toast } from "sonner";

function formatInterval(seconds: number): string {
  if (seconds < 3600) return `Every ${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `Every ${Math.round(seconds / 3600)}h`;
  if (seconds < 604800) return `Every ${Math.round(seconds / 86400)}d`;
  if (seconds < 2592000) return `Weekly`;
  return `Monthly`;
}

export function ActiveDelegations() {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const { data: delegations, isLoading } = useQuery({
    queryKey: ["delegations", address],
    queryFn: async () => {
      if (!address) return [];
      return getDelegations({ data: address });
    },
    enabled: !!address,
    refetchInterval: 5000,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!address) throw new Error("No wallet connected");
      return cancelDelegation({ data: { id, ownerAddress: address } });
    },
    onSuccess: () => {
      toast.success("Delegation cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["delegations", address] });
      queryClient.invalidateQueries({ queryKey: ["stats", address] });
    },
    onError: () => {
      toast.error("Failed to cancel delegation");
    },
  });

  return (
    <Card className="col-span-1 lg:col-span-7 border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden p-6 flex flex-col h-[calc(100vh-280px)] min-h-[520px]">
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
          <History className="h-5 w-5 text-zinc-400" />
          Active Delegations
        </h3>
        {delegations && delegations.length > 0 && (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-xs">
            {delegations.filter(d => d.isActive).length} Active
          </Badge>
        )}
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
              <th className="px-4 py-3 font-normal text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-zinc-300">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-zinc-400" />
                  Loading active delegations...
                </td>
              </tr>
            ) : !delegations || delegations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  <p className="mb-1">No delegations found.</p>
                  <p className="text-xs text-zinc-600">
                    Use the chat to create your first subscription.
                  </p>
                </td>
              </tr>
            ) : (
              delegations.map((del) => (
                <tr key={del.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-100">
                    {del.recipientAddress.length > 20
                      ? `${del.recipientAddress.slice(0, 6)}...${del.recipientAddress.slice(-4)}`
                      : del.recipientAddress}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {(Number(del.amount) / 10 ** 6).toFixed(2)} USDC
                  </td>
                  <td className="px-4 py-3">
                    {formatInterval(del.intervalSeconds)}
                  </td>
                  <td className="px-4 py-3">
                    {del.isActive ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-0 rounded-sm font-normal text-xs px-2 py-0.5">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-800 text-zinc-400 hover:bg-zinc-800 border-0 rounded-sm font-normal text-xs px-2 py-0.5">
                        Cancelled
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-zinc-500">
                    {new Date(del.nextRunTime).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {del.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-600 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => cancelMutation.mutate(del.id)}
                        disabled={cancelMutation.isPending}
                        title="Cancel delegation"
                      >
                        {cancelMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
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
