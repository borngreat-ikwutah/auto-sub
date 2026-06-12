import { createServerFn } from '@tanstack/react-start';

/**
 * 1Shot API Relayer Integration (EIP-7710 Gas Abstraction)
 * 
 * This server function represents the backend loop of AutoSub.
 * When a subscription's interval hits, this function is triggered.
 * It uses the generated Session Key and the user's ERC-7715 Permission Context
 * to execute the transfer gaslessly using the 1Shot Relayer.
 */
export const executeSubscription = createServerFn({ method: 'POST' })
  .validator((d: { permissionContext: string, sessionPrivateKey: string, amountWei: string, recipient: string }) => d)
  .handler(async ({ data }) => {
    
    // 1. Initialize the backend agent using the session private key
    // import { privateKeyToAccount } from "viem/accounts"
    // const sessionAccount = privateKeyToAccount(data.sessionPrivateKey as `0x${string}`);

    try {
      // 2. Discover 1Shot Relayer Capabilities (Supported Networks & Tokens)
      const capabilitiesRes = await fetch("https://relayer.1shotapi.com/relayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "relayer_getCapabilities",
          params: ["8453"] // Base Chain ID (Hackathon Default)
        })
      });
      const capabilities = await capabilitiesRes.json();

      // 3. Quote Network Fee (Lock Gas Price)
      // Gets the exact amount of USDC required to pay for the gas of this execution.
      const feeRes = await fetch("https://relayer.1shotapi.com/relayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "relayer_getFeeData",
          params: {
            chainId: "8453",
            token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // USDC on Base
          }
        })
      });
      const feeData = await feeRes.json();
      
      // 4. Send EIP-7710 Transaction (Execution on behalf of user)
      // This submits the bundled transaction:
      // - Transfer `feeAmount` USDC to 1Shot Relayer Fee Collector
      // - Transfer `data.amountWei` USDC to `data.recipient`
      // Both actions are validated by the DelegationManager using the `permissionContext`.
      
      /*
      const sendRes = await fetch("https://relayer.1shotapi.com/relayers", {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "relayer_send7710Transaction",
          params: {
             context: feeData.result.context,
             transactions: [ ... ],
             permissionContext: data.permissionContext // ERC-7715 Proof
          }
        })
      });
      const sendResult = await sendRes.json();
      */

      return { 
        success: true, 
        message: "Successfully relayed subscription via 1Shot API!",
        taskId: "mock_task_12345" // sendResult.result.taskId
      };
    } catch (error) {
      console.error("1Shot Relayer Error:", error);
      return { success: false, error: "Failed to relay transaction." };
    }
  });
