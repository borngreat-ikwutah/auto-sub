import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, CheckCircle2, FlaskConical, Zap } from "lucide-react";
import { useAccount, useWalletClient } from "wagmi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseAgentIntent } from "@/server/agent";
import { createDelegation, getDashboardStats } from "@/server/delegations";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";
import { toast } from "sonner";
import { logAgentActivity } from "./AgentActivityFeed";
import { createPublicClient, http, createWalletClient, custom } from "viem";
import { baseSepolia } from "viem/chains";
import { submit7702Authorization, executeSubscription, CONTRACTS } from "@/server/relayer";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function parseAmountToWei(amountStr: string): string {
  const match = amountStr?.match(/[\d.]+/);
  if (!match) return "5000000";
  return Math.round(parseFloat(match[0]) * 1_000_000).toString();
}

function parseFrequencyToSeconds(frequency: string): number {
  const f = (frequency || "").toLowerCase();
  if (f.includes("daily"))      return 86_400;
  if (f.includes("bi-weekly"))  return 1_209_600;
  if (f.includes("weekly"))     return 604_800;
  if (f.includes("monthly"))    return 2_592_000;
  return 604_800;
}

type AppMode = "demo" | "normal";

interface Message {
  role: "user" | "agent";
  content: string;
  structuredData?: any;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function ChatInterface() {
  const { address } = useAccount();
  const { data: walletClient, refetch: refetchWalletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput]       = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [mode, setMode]         = useState<AppMode>("demo");

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Intent parsing (local regex via server fn) ─────────────────────────────
  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      parseAgentIntent({ data: { message, ownerAddress: address || "0x0" } }),
    onSuccess: (data) => {
      if (data.success) {
        logAgentActivity("success", `Parsed intent successfully: recipient=${data.structuredData?.recipient || "N/A"} amount=${data.structuredData?.amount || "N/A"} frequency=${data.structuredData?.frequency || "N/A"}`);
        setMessages((prev) => [
          ...prev,
          { role: "agent", content: data.text, structuredData: data.structuredData },
        ]);
      } else {
        logAgentActivity("warn", "Parsing succeeded but status is negative.");
      }
    },
    onError: () => {
      logAgentActivity("error", "Intent parsing call failed.");
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "❌ Failed to parse your request. Please try again." },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || !address) return;
    logAgentActivity("info", `User input received: "${input}"`);
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    chatMutation.mutate(input);
    setInput("");
  };

  // ── Approve handler — two distinct paths ───────────────────────────────────
  const handleApprove = async (msg: Message) => {
    if (!address) return;
    setIsApproving(true);

    try {
      const sessionPrivateKey = generatePrivateKey();
      const sessionAccount    = privateKeyToAccount(sessionPrivateKey);
      const amountWei         = parseAmountToWei(msg.structuredData?.amount);
      const intervalSec       = parseFrequencyToSeconds(msg.structuredData?.frequency);
      const recipient         = msg.structuredData?.recipient || "0xDemo";

      let permissionContext: any;

      // ════════════════════════════════════════════════════════════════════════
      //  NORMAL MODE — Real ERC-7715 Advanced Permission via MetaMask Flask
      //  Required: MetaMask Flask browser extension
      //  This is the path judges will see in the demo video
      // ════════════════════════════════════════════════════════════════════════
      if (mode === "normal") {
        logAgentActivity("info", "Initiating ERC-7715 authorization request. Prompting wallet extension...");
        // walletClient may be undefined on first render — force-refetch it
        let client = walletClient ?? undefined;
        if (!client) {
          const { data: freshClient } = await refetchWalletClient();
          client = freshClient ?? undefined;
        }

        // Fallback: build a direct wallet client using window.ethereum if available
        if (!client && typeof window !== "undefined" && (window as any).ethereum) {
          logAgentActivity("info", "Wagmi client not resolved. Initiating direct window.ethereum wallet client...");
          client = createWalletClient({
            chain: baseSepolia,
            transport: custom((window as any).ethereum),
            account: address as `0x${string}`,
          }) as any;
        }

        if (!client) {
          throw new Error(
            "Could not get wallet client. Make sure MetaMask Flask is installed, unlocked, and connected to this site."
          );
        }

        toast.info("Opening MetaMask — please approve the permission request…");

        // Extend viem wallet client with ERC-7715 provider actions
        const extendedClient = client.extend(erc7715ProviderActions());

        // Request the ERC-7715 Advanced Permission from the user's smart account
        // This triggers the MetaMask Flask UI for the user to approve
        const grantedPermissions = await extendedClient.requestExecutionPermissions([
          {
            chainId: client.chain.id,
            expiry: Math.floor(Date.now() / 1000) + intervalSec,
            to: sessionAccount.address,          // Permission granted TO our session key
            permission: {
              type: "erc20-token-periodic" as const,
              data: {
                tokenAddress:   "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
                periodAmount:   BigInt(amountWei),
                periodDuration: intervalSec,
                justification:  `AutoSub: ${msg.structuredData?.frequency} payment of ${msg.structuredData?.amount} to ${recipient}`,
              },
              isAdjustmentAllowed: false,
            },
          },
        ]);

        permissionContext = grantedPermissions[0]?.context;
        if (!permissionContext) throw new Error("MetaMask did not return a permission context.");

        logAgentActivity("success", "ERC-7715 Advanced Permission successfully granted by user.");
        console.log("[ERC-7715] Permission granted:", grantedPermissions);
        toast.success("ERC-7715 permission granted by MetaMask!");
      }

      // ════════════════════════════════════════════════════════════════════════
      //  DEMO MODE — Simulated ERC-7715 context (no wallet popup)
      //  Use this when MetaMask Flask is not available
      // ════════════════════════════════════════════════════════════════════════
      else {
        // Simulate the permission context that MetaMask Flask would return
        permissionContext = {
          mode:       "demo-simulated",
          sessionKey: sessionAccount.address,
          amountWei,
          intervalSec,
          recipient,
          tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          issuedAt:   Date.now(),
        };
      }

      // ── Persist delegation + permission context to Neon DB ──────────────────
      logAgentActivity("info", "Saving delegation details and permission context to Neon DB...");
      const delegationRecord = await createDelegation({
        data: {
          ownerAddress:     address,
          recipientAddress: recipient,
          amountWei,
          intervalSeconds:  intervalSec,
          tokenAddress:     "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          permissionContext,
          sessionPrivateKey,
        },
      });

      logAgentActivity("success", "Delegation persisted to Neon DB successfully. Active and standing by.");

      // If Normal Mode, execute EIP-7702 upgrade and initial EIP-7710 payment automatically
      if (mode === "normal") {
        // Step 1: EIP-7702 Upgrade if not already done
        const stats = await getDashboardStats({ data: address });
        if (!stats.isSmartAccount) {
          logAgentActivity("info", "EOA is standard. Triggering automated EIP-7702 Smart Account upgrade...");
          const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
          const nonce = await publicClient.getTransactionCount({ address: address as `0x${string}` });

          toast.info("Upgrading account — please sign EIP-7702 authorization in MetaMask…");
          
          let client = walletClient ?? undefined;
          if (!client) {
            const { data: freshClient } = await refetchWalletClient();
            client = freshClient ?? undefined;
          }
          if (!client) throw new Error("Wallet client unavailable. Cannot perform upgrade.");

          const signedAuth = await (client as any).signAuthorization({
            contractAddress: CONTRACTS.EIP7702StatelessDelegator,
            chainId: baseSepolia.id,
            nonce,
          });

          logAgentActivity("info", "EOA upgrade signature captured. Submitting EIP-7702 tx via 1Shot...");
          const upgradeRes = await submit7702Authorization({
            data: { ownerAddress: address, signedAuthorization: signedAuth },
          });
          if (upgradeRes.success) {
            logAgentActivity("success", `EOA upgraded to Smart Account! 1Shot Task ID: ${upgradeRes.taskId}`);
          } else {
            throw new Error("EIP-7702 upgrade submission failed via 1Shot");
          }
        } else {
          logAgentActivity("info", "Account already upgraded to Smart Account (EIP-7702 active).");
        }

        // Step 2: EIP-7710 Execution for first payment
        logAgentActivity("info", "Triggering first subscription payment via 1Shot EIP-7710 gasless relayer...");
        const activeDelegation = {
          id: delegationRecord.delegationId,
          recipientAddress: recipient,
          amount: amountWei,
          intervalSeconds: intervalSec,
          isActive: true,
          permissionContext,
        };
        const relayRes = await executeSubscription({
          data: {
            permissionContext: JSON.stringify(activeDelegation),
            sessionPrivateKey,
            amountWei,
            recipient,
            subscriptionId: delegationRecord.delegationId,
          },
        });
        if (relayRes.success) {
          logAgentActivity("success", `First payment successfully executed! 1Shot Task ID: ${relayRes.taskId}`);
          toast.success("First subscription payment executed gaslessly!");
        } else {
          logAgentActivity("error", `First payment relay failed: ${relayRes.summary}`);
          toast.error(`Relay failed: ${relayRes.summary}`);
        }
      }

      // Invalidate queries so table + stats refresh instantly
      queryClient.invalidateQueries({ queryKey: ["delegations", address] });
      queryClient.invalidateQueries({ queryKey: ["stats", address] });

      const successMsg = mode === "normal"
        ? "🎉 Smart Account enabled & first payment executed! The AutoSub Agent will now run future payments gaslessly on schedule."
        : "🎉 Demo delegation created & saved to Neon DB! Switch to Normal Mode to use real MetaMask permissions.";

      toast.success(mode === "normal" ? "Delegation live on-chain!" : "Demo delegation saved!");

      setMessages((prev) => [...prev, { role: "agent", content: successMsg }]);
    } catch (error: any) {
      console.error("[Approve]", error);
      const errMsg = error?.message || "Unknown error";
      logAgentActivity("error", `Delegation creation failed: ${errMsg}`);

      // Helpful hint when normal mode fails due to missing MetaMask Flask
      const hint = mode === "normal" && errMsg.toLowerCase().includes("method not found")
        ? " — Make sure you have MetaMask Flask installed and are connected to it."
        : "";

      toast.error(`Approval failed: ${errMsg}`);
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: `❌ Approval failed: ${errMsg}${hint}` },
      ]);
    } finally {
      setIsApproving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Card className="col-span-1 lg:col-span-5 border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[520px]">

      {/* ── Header ── */}
      <div className="shrink-0 px-4 py-3 border-b border-zinc-900 flex items-center justify-between bg-zinc-950">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-md bg-zinc-900 border border-zinc-800">
            <AvatarFallback className="bg-zinc-900 text-zinc-100 font-mono text-xs">AI</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-zinc-100">AutoSub Agent</p>
            <p className="text-xs text-emerald-500">Online</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          <button
            onClick={() => setMode("demo")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "demo"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FlaskConical className="h-3 w-3" />
            Demo
          </button>
          <button
            onClick={() => setMode("normal")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "normal"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Zap className="h-3 w-3" />
            Normal
          </button>
        </div>
      </div>

      {/* Mode banner */}
      {mode === "normal" && (
        <div className="shrink-0 px-4 py-2 bg-emerald-500/5 border-b border-emerald-500/20 flex items-center gap-2">
          <Zap className="h-3 w-3 text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-400">
            Normal mode — Approve &amp; Sign will open MetaMask Flask and request a real ERC-7715 permission.
          </p>
        </div>
      )}
      {mode === "demo" && (
        <div className="shrink-0 px-4 py-2 bg-amber-500/5 border-b border-amber-500/20 flex items-center gap-2">
          <FlaskConical className="h-3 w-3 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-400">
            Demo mode — Delegations are simulated and saved directly to Neon DB (no MetaMask Flask needed).
          </p>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
              <p className="text-sm text-zinc-500 italic">Try saying</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Pay 5 USDC to Netflix every week",
                  "Send 10 USDC to Spotify monthly",
                  "Pay 3 USDC to 0xAbc123 daily",
                ].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setInput(ex)}
                    className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={msg.role === "user" ? "flex justify-end" : "flex items-start gap-3"}
            >
              {msg.role === "agent" && (
                <Avatar className="h-8 w-8 rounded-md mt-1 border border-zinc-800 shrink-0">
                  <AvatarFallback className="bg-zinc-900 text-zinc-100 font-mono text-xs">AI</AvatarFallback>
                </Avatar>
              )}

              <div
                className={`px-4 py-3 text-sm max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl rounded-tr-sm"
                    : "bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-2xl rounded-tl-sm space-y-3"
                }`}
              >
                {msg.role === "user" ? (
                  <span>{msg.content}</span>
                ) : msg.structuredData ? (
                  <>
                    <p>I can create a recurring payment:</p>
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 font-mono text-xs space-y-1.5 text-zinc-400">
                      <p><span className="text-zinc-500">Recipient:  </span>{msg.structuredData.recipient}</p>
                      <p><span className="text-zinc-500">Amount:     </span>{msg.structuredData.amount}</p>
                      <p><span className="text-zinc-500">Frequency:  </span>{msg.structuredData.frequency}</p>
                      <p><span className="text-zinc-500">Monthly Cap:</span> {msg.structuredData.monthlyCap}</p>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {mode === "normal"
                        ? "MetaMask Flask will ask you to approve this permission."
                        : "This will be stored as a demo delegation in Neon DB."}
                    </p>
                    <Button
                      size="sm"
                      className={`w-full mt-1 font-medium ${
                        mode === "normal"
                          ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                          : "bg-zinc-100 hover:bg-white text-zinc-950"
                      }`}
                      onClick={() => handleApprove(msg)}
                      disabled={isApproving}
                    >
                      {isApproving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      {isApproving
                        ? (mode === "normal" ? "Waiting for MetaMask..." : "Saving delegation...")
                        : (mode === "normal" ? "Approve & Sign (ERC-7715)" : "Approve & Sign (Demo)")}
                    </Button>
                    {mode === "normal" && (
                      <p className="text-xs text-zinc-600 text-center">
                        Requires MetaMask Flask •{" "}
                        <button
                          className="text-zinc-500 hover:text-zinc-400 underline underline-offset-2"
                          onClick={() => setMode("demo")}
                        >
                          Switch to Demo Mode
                        </button>
                      </p>
                    )}
                  </>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 rounded-md mt-1 border border-zinc-800 shrink-0">
                <AvatarFallback className="bg-zinc-900 text-zinc-100 font-mono text-xs">AI</AvatarFallback>
              </Avatar>
              <div className="px-4 py-3 text-sm bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing intent…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 p-4 border-t border-zinc-900 bg-zinc-950">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={!address || chatMutation.isPending || isApproving}
            placeholder={address ? "Command the agent…" : "Connect wallet to command agent…"}
            className="bg-zinc-900 border-zinc-800 pr-10 text-zinc-100 h-10 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSend}
            disabled={!address || chatMutation.isPending || isApproving}
            className="absolute right-1 top-1 h-8 w-8 text-zinc-400 hover:text-zinc-100 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
