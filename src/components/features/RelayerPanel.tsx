import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Radio,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  get1ShotQuote,
  getRelayerTaskStatus,
  submit7702Authorization,
  executeSubscription,
  CONTRACTS,
} from "@/server/relayer";
import { getDelegations } from "@/server/delegations";
import { useAccount, useWalletClient } from "wagmi";
import { createPublicClient, http, createWalletClient, custom } from "viem";
import { base } from "viem/chains";
import { toast } from "sonner";
import { logAgentActivity } from "./AgentActivityFeed";

// ─── Step expander ────────────────────────────────────────────────────────────

function StepRow({
  step,
}: {
  step: { step: string; status: "ok" | "error"; detail: any };
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-900/50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {step.status === "ok" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-red-400    shrink-0" />
        )}
        <span className="text-xs font-mono text-zinc-300 flex-1">
          {step.step}
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <pre className="text-xs text-zinc-400 bg-zinc-900 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {JSON.stringify(step.detail, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Task status poller ───────────────────────────────────────────────────────

function TaskStatusBadge({ taskId }: { taskId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["task-status", taskId],
    queryFn: () => getRelayerTaskStatus({ data: { taskId } }),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      if (s === "confirmed" || s === "failed") return false; // stop polling
      return 3000; // poll every 3s
    },
    enabled: !!taskId,
  });

  if (isLoading)
    return (
      <span className="flex items-center gap-1 text-xs text-zinc-500">
        <Loader2 className="h-3 w-3 animate-spin" /> polling…
      </span>
    );

  const status = data?.status ?? "unknown";
  const color =
    status === "confirmed"
      ? "bg-emerald-500/10 text-emerald-400"
      : status === "failed"
      ? "bg-red-500/10 text-red-400"
      : "bg-amber-500/10 text-amber-400";

  return (
    <div className="space-y-1">
      <Badge className={`border-0 text-xs ${color}`}>{status}</Badge>
      {data?.txHash && (
        <a
          href={`https://basescan.org/tx/${data.txHash}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
        >
          View on Basescan <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RelayerPanel() {
  const { address } = useAccount();
  const { data: walletClient, refetch: refetchWalletClient } =
    useWalletClient();
  const queryClient = useQueryClient();

  const [upgradeResult, setUpgradeResult] = useState<any>(null);
  const [relayResult, setRelayResult] = useState<any>(null);

  // ── Live fee quote (always on, shows 1Shot is real) ───────────────────────
  const quoteQuery = useQuery({
    queryKey: ["1shot-quote"],
    queryFn: () => get1ShotQuote({ data: undefined }),
    staleTime: 30_000,
    retry: 1,
  });

  // ── EIP-7702: Upgrade EOA → Smart Account ────────────────────────────────
  const upgradeMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("No wallet connected");

      logAgentActivity(
        "info",
        "Initiating EIP-7702 account upgrade. Requesting user signature...",
      );
      let client = walletClient ?? undefined;
      if (!client) {
        const { data: fresh } = await refetchWalletClient();
        client = fresh ?? undefined;
      }

      // Fallback: build a direct wallet client using window.ethereum if available
      if (
        !client &&
        typeof window !== "undefined" &&
        (window as any).ethereum
      ) {
        logAgentActivity(
          "info",
          "Wagmi client not resolved. Initiating direct window.ethereum wallet client...",
        );
        client = createWalletClient({
          chain: base,
          transport: custom((window as any).ethereum),
          account: address as `0x${string}`,
        }) as any;
      }

      if (!client)
        throw new Error(
          "Wallet client unavailable. Ensure MetaMask is connected.",
        );

      // Create a public client to get the current nonce
      const publicClient = createPublicClient({
        chain: base,
        transport: http(),
      });
      const nonce = await publicClient.getTransactionCount({
        address: address as `0x${string}`,
      });

      toast.info("Signing EIP-7702 authorization — check MetaMask…");

      // Sign the EIP-7702 authorization (upgrades EOA to use the stateless delegator)
      const signedAuth = await (client as any).signAuthorization({
        contractAddress: CONTRACTS.EIP7702StatelessDelegator,
        chainId: base.id,
        nonce,
      });

      console.log("[7702] Signed authorization:", signedAuth);
      logAgentActivity(
        "info",
        "EOA upgrade signature captured. Transmitting to 1Shot API...",
      );
      toast.info("Submitting EIP-7702 upgrade via 1Shot relayer…");

      return submit7702Authorization({
        data: { ownerAddress: address, signedAuthorization: signedAuth },
      });
    },
    onSuccess: (result) => {
      setUpgradeResult(result);
      if (result.success) {
        logAgentActivity(
          "success",
          `EIP-7702 upgrade transaction submitted via 1Shot! Task ID: ${result.taskId}`,
        );
        toast.success(`Account upgraded! Task: ${result.taskId}`);
        queryClient.invalidateQueries({ queryKey: ["stats", address] });
      } else {
        logAgentActivity(
          "warn",
          "EIP-7702 submission returned no Task ID. Please check raw response.",
        );
        toast.error("Upgrade returned no taskId — check steps.");
      }
    },
    onError: (err: any) => {
      logAgentActivity("error", `EIP-7702 upgrade failed: ${err.message}`);
      toast.error(err.message || "Upgrade failed");
    },
  });

  // ── EIP-7710: Relay subscription payment ─────────────────────────────────
  const relayMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("No wallet connected");
      logAgentActivity(
        "info",
        "Executing periodic EIP-7710 transaction bundle (USDC gas abstracting)...",
      );
      const delegations = await getDelegations({ data: address });
      const active = delegations.find((d) => d.isActive);
      if (!active) throw new Error("No active delegations to relay");

      return executeSubscription({
        data: {
          permissionContext: JSON.stringify(active),
          sessionPrivateKey:
            "0x0000000000000000000000000000000000000000000000000000000000000001",
          amountWei: active.amount,
          recipient: active.recipientAddress,
          subscriptionId: active.id,
        },
      });
    },
    onSuccess: (result) => {
      setRelayResult(result);
      if (result.success) {
        logAgentActivity(
          "success",
          `EIP-7710 transaction bundle relayed! Task ID: ${result.taskId}`,
        );
      } else {
        logAgentActivity("error", `1Shot execution failed: ${result.summary}`);
      }
      toast[result.success ? "success" : "error"](result.summary);
      queryClient.invalidateQueries({ queryKey: ["delegations", address] });
      queryClient.invalidateQueries({ queryKey: ["stats", address] });
    },
    onError: (err: any) => {
      logAgentActivity("error", `EIP-7710 relay failed: ${err.message}`);
      toast.error(err.message || "Relay failed");
    },
  });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Radio className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              1Shot API Relayer
            </h3>
            <p className="text-xs text-zinc-500">
              Gasless EIP-7702 + EIP-7710 execution
            </p>
          </div>
        </div>
        <a
          href="https://1shotapi.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          1shotapi.com <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Grid: fee quote + pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Fee Quote */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Live Fee Quote
            </p>
            {quoteQuery.isLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
            )}
            {quoteQuery.isSuccess && (
              <Badge
                className={`border-0 text-xs ${
                  quoteQuery.data.success
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {quoteQuery.data.success ? "Live ✓" : "API Error"}
              </Badge>
            )}
          </div>

          {quoteQuery.isSuccess && quoteQuery.data.success && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Relay Fee</span>
                <span className="font-mono text-zinc-100">
                  {quoteQuery.data.feeUsdc} USDC
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Chain</span>
                <span className="font-mono text-zinc-100">Base (8453)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Method</span>
                <span className="font-mono text-blue-400">
                  relayer_getFeeData
                </span>
              </div>
              <div className="text-xs">
                <span className="text-zinc-500 block mb-1">Fee Collector</span>
                <span className="font-mono text-zinc-400 text-xs break-all">
                  {quoteQuery.data.feeCollector}
                </span>
              </div>
              <details className="group mt-2">
                <summary className="text-xs text-zinc-600 hover:text-zinc-400 cursor-pointer list-none flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                  Raw JSON-RPC
                </summary>
                <pre className="mt-2 text-xs text-zinc-600 bg-zinc-900 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed max-h-40">
                  {JSON.stringify(
                    {
                      req: quoteQuery.data.request,
                      res: quoteQuery.data.response,
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </div>
          )}
          {quoteQuery.isError && (
            <p className="text-xs text-red-400">Cannot reach 1Shot endpoint.</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-zinc-500 hover:text-zinc-300 text-xs"
            onClick={() => quoteQuery.refetch()}
            disabled={quoteQuery.isLoading}
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh Quote
          </Button>
        </div>

        {/* Relay Pipeline Steps */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Relay Pipeline
          </p>

          {/* Step A: EIP-7702 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  upgradeResult?.success
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                1
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-zinc-300">
                  EIP-7702 — Upgrade Account
                </p>
                <p className="text-xs text-zinc-600">
                  EOA → Smart Account via 1Shot
                </p>
              </div>
              {upgradeResult?.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : upgradeResult ? (
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              ) : null}
            </div>
            <Button
              size="sm"
              className={`w-full text-xs ${
                upgradeResult?.success
                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              }`}
              onClick={() => upgradeMutation.mutate()}
              disabled={upgradeMutation.isPending || !address}
            >
              {upgradeMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" /> Submitting
                  via 1Shot…
                </>
              ) : upgradeResult?.success ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Upgraded
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3 w-3 mr-1" /> Sign &amp; Upgrade
                  (EIP-7702)
                </>
              )}
            </Button>
            {upgradeResult?.taskId && (
              <div className="px-2">
                <p className="text-xs text-zinc-500 mb-1">Task status:</p>
                <TaskStatusBadge taskId={upgradeResult.taskId} />
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800" />

          {/* Step B: EIP-7710 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  relayResult?.success
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                2
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-zinc-300">
                  EIP-7710 — Relay Payment
                </p>
                <p className="text-xs text-zinc-600">
                  Gas paid in USDC via 1Shot
                </p>
              </div>
              {relayResult?.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : relayResult ? (
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              ) : null}
            </div>
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
              onClick={() => relayMutation.mutate()}
              disabled={relayMutation.isPending || !address}
            >
              {relayMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" /> Calling
                  1Shot API…
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 mr-1" /> Execute via 1Shot (EIP-7710)
                </>
              )}
            </Button>
            {relayResult?.taskId && (
              <div className="px-2">
                <p className="text-xs text-zinc-500 mb-1">Task status:</p>
                <TaskStatusBadge taskId={relayResult.taskId} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Relay Steps Log */}
      {upgradeResult?.steps?.length || relayResult?.steps?.length ? (
        <div className="space-y-3">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            API Call Log
          </p>
          {upgradeResult?.steps?.map((s: any, i: number) => (
            <StepRow key={`u-${i}`} step={s} />
          ))}
          {relayResult?.steps?.map((s: any, i: number) => (
            <StepRow key={`r-${i}`} step={s} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
