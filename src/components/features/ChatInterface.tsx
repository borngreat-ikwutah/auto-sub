import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { useAccount, useWalletClient } from "wagmi";
import { useMutation } from "@tanstack/react-query";
import { parseAgentIntent } from "@/server/agent";
import { createDelegation } from "@/server/delegations";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";

export function ChatInterface() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: 'user'|'agent', content: string, structuredData?: any }[]>([]);
  const [isApproving, setIsApproving] = useState(false);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const result = await parseAgentIntent({
        data: { message, ownerAddress: address || "0x0" },
      });
      return result;
    },
    onSuccess: (data) => {
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'agent', content: data.text, structuredData: data.structuredData }
        ]);
      }
    }
  });

  const handleSend = () => {
    if (!input.trim() || !address) return;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    chatMutation.mutate(input);
    setInput("");
  };

  const handleApprove = async (msg: any) => {
    if (!walletClient) return;
    setIsApproving(true);
    try {
      // 1. Extend the Wagmi viem client with MetaMask Advanced Permissions actions
      const extendedClient = walletClient.extend(erc7715ProviderActions());
      
      // 2. Generate a fresh Session Key (EOA) for the AutoSub backend agent
      const sessionPrivateKey = generatePrivateKey();
      const sessionAccount = privateKeyToAccount(sessionPrivateKey);

      // 3. Request the Advanced Permission (ERC-7715) from the user
      // Assuming a mock USDC address for the hackathon demo
      const grantedPermissions = await extendedClient.requestExecutionPermissions([{
        chainId: walletClient.chain.id,
        expiry: Math.floor(Date.now() / 1000) + 604800, // Expires in 1 week
        to: sessionAccount.address, // Permission granted TO our backend session key
        permission: {
          type: 'erc20-token-periodic',
          data: {
            tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
            periodAmount: 5000000n, // 5 USDC (6 decimals)
            periodDuration: 604800, // 1 week
            justification: `AutoSub Agent requires permission for ${msg.structuredData.frequency} payments to ${msg.structuredData.recipient}`,
          },
          isAdjustmentAllowed: true,
        }
      }]);

      console.log("Permission Granted:", grantedPermissions);
      
      // Save the subscription and permission to Neon Database
      await createDelegation({
        data: {
          ownerAddress: address || "0x0",
          recipientAddress: msg.structuredData.recipient || "0x0",
          amountWei: "5000000", // 5 USDC in wei mock
          intervalSeconds: 604800, // 1 week mock
          tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          permissionContext: grantedPermissions[0].context,
          sessionPrivateKey: sessionPrivateKey
        }
      });
      
      setMessages((prev) => [
        ...prev,
        { role: 'agent', content: "🎉 Permission granted! I have secured the ERC-7715 delegation. AutoSub will now execute these payments gaslessly via the 1Shot API Relayer on your behalf." }
      ]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: 'agent', content: `❌ Permission request failed: ${error?.message || 'Unknown error'}` }
      ]);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-5 border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden flex flex-col h-[500px]">
      <div className="shrink-0 p-4 border-b border-zinc-900 flex items-center gap-3 bg-zinc-950">
        <Avatar className="h-8 w-8 rounded-md bg-zinc-900 border border-zinc-800">
          <AvatarFallback className="bg-zinc-900 text-zinc-100 font-mono text-xs">AI</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-zinc-100">AutoSub Agent</p>
          <p className="text-xs text-emerald-500">Online</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col">
        <div className="space-y-6 flex-1">
          {messages.length === 0 && (
             <div className="h-full flex items-center justify-center text-sm text-zinc-500 italic">
               Try saying "Pay 5 USDC to Netflix every week"
             </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={msg.role === 'user' ? "flex justify-end" : "flex items-start gap-3"}>
              {msg.role === 'agent' && (
                <Avatar className="h-8 w-8 rounded-md mt-1 border border-zinc-800 shrink-0">
                  <AvatarFallback className="bg-zinc-900 text-zinc-100 font-mono text-xs">AI</AvatarFallback>
                </Avatar>
              )}
              
              <div className={`px-4 py-3 text-sm max-w-[85%] ${
                msg.role === 'user' 
                  ? "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl rounded-tr-sm"
                  : "bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-2xl rounded-tl-sm space-y-3"
              }`}>
                {msg.role === 'user' ? (
                   msg.content
                ) : (
                  <>
                    {msg.structuredData ? (
                      <>
                        <p>I can create a recurring payment:</p>
                        <div className="bg-zinc-900 p-3 rounded border border-zinc-800 font-mono text-xs space-y-1 text-zinc-400">
                          <p><span className="text-zinc-500">Recipient:</span> {msg.structuredData.recipient}</p>
                          <p><span className="text-zinc-500">Amount:</span> {msg.structuredData.amount}</p>
                          <p><span className="text-zinc-500">Frequency:</span> {msg.structuredData.frequency}</p>
                          <p><span className="text-zinc-500">Monthly Cap:</span> {msg.structuredData.monthlyCap}</p>
                        </div>
                        <p>Approve this delegation?</p>
                        <Button 
                          size="sm" 
                          className="w-full bg-zinc-100 text-zinc-950 hover:bg-white mt-2 font-medium"
                          onClick={() => handleApprove(msg)}
                          disabled={isApproving}
                        >
                          {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                          {isApproving ? "Waiting for Wallet..." : "Approve & Sign"}
                        </Button>
                      </>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {chatMutation.isPending && (
             <div className="flex items-start gap-3">
               <Avatar className="h-8 w-8 rounded-md mt-1 border border-zinc-800 shrink-0">
                 <AvatarFallback className="bg-zinc-900 text-zinc-100 font-mono text-xs">AI</AvatarFallback>
               </Avatar>
               <div className="px-4 py-3 text-sm bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-2xl rounded-tl-sm flex items-center">
                 <Loader2 className="h-4 w-4 animate-spin mr-2" />
                 Parsing intent with Venice AI...
               </div>
             </div>
          )}
        </div>
      </div>

      <div className="shrink-0 p-4 border-t border-zinc-900 bg-zinc-950">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={!address || chatMutation.isPending || isApproving}
            placeholder={address ? "Command the agent..." : "Connect wallet to command agent..."}
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
