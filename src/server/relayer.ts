import { createServerFn } from '@tanstack/react-start';
import { encodeFunctionData, parseAbi } from 'viem';
import { db } from '@/db';
import { subscriptions, smartAccounts } from '@/db/schema';
import { eq, lte, and } from 'drizzle-orm';

// ─── Contract Addresses (Base Sepolia Testnet, MetaMask Delegation Toolkit v1.3.0) ────
export const CONTRACTS = {
  // The DelegationManager — core of EIP-7710 delegated execution (Base Sepolia)
  DelegationManager:       '0x739Ca6D71365a08f584c8FC1E8F7eFdf27942b3c' as `0x${string}`,
  // The EIP-7702 stateless delegator implementation — deterministic CREATE2 address, same on all chains
  EIP7702StatelessDelegator: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B' as `0x${string}`,
  // USDC on Base Sepolia (Circle testnet USDC)
  USDC:                    '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
};

const ONE_SHOT_URL  = 'https://relayer.1shotapi.com/relayers';
const BASE_CHAIN_ID = '84532'; // Base Sepolia testnet chain ID

const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
]);

function buildTransferCalldata(to: `0x${string}`, amountWei: string) {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [to, BigInt(amountWei)],
  });
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

async function oneShotPost(id: number, method: string, params: any) {
  const body = { jsonrpc: '2.0', id, method, params };
  const res  = await fetch(ONE_SHOT_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const json = await res.json();
  return { request: body, response: json };
}

// ─── Server Fn 1: Live fee quote from 1Shot ───────────────────────────────────
export const get1ShotQuote = createServerFn({ method: 'POST' })
  .validator((_: void) => _)
  .handler(async () => {
    const { request, response } = await oneShotPost(1, 'relayer_getFeeData', {
      chainId: BASE_CHAIN_ID,
      token:   CONTRACTS.USDC,
    });

    return {
      success:      !response.error,
      endpoint:     ONE_SHOT_URL,
      method:       'relayer_getFeeData',
      chainId:      BASE_CHAIN_ID,
      token:        CONTRACTS.USDC,
      request,
      response,
      feeUsdc:      response.result?.feeAmount
                      ? (Number(response.result.feeAmount) / 1_000_000).toFixed(6)
                      : null,
      feeCollector: response.result?.feeCollector ?? null,
    };
  });

// ─── Server Fn 2: Poll relay task status from 1Shot ───────────────────────────
export const getRelayerTaskStatus = createServerFn({ method: 'POST' })
  .validator((d: { taskId: string }) => d)
  .handler(async ({ data }) => {
    const { request, response } = await oneShotPost(3, 'relayer_getTaskStatus', {
      taskId: data.taskId,
    });
    return {
      taskId:  data.taskId,
      status:  response.result?.status   ?? response.error?.message ?? 'unknown',
      txHash:  response.result?.txHash   ?? null,
      blockNumber: response.result?.blockNumber ?? null,
      request,
      response,
    };
  });

// ─── Server Fn 3: Submit EIP-7702 authorization via 1Shot ─────────────────────
/**
 * EIP-7702 upgrades a regular EOA into a smart account by setting its
 * code to point to the EIP7702StatelessDeleGator implementation.
 *
 * The signed authorization is produced client-side via:
 *   walletClient.signAuthorization({ contractAddress: CONTRACTS.EIP7702StatelessDelegator })
 *
 * This server fn wraps it in a 1Shot relay call so the user doesn't need ETH for gas.
 */
export const submit7702Authorization = createServerFn({ method: 'POST' })
  .validator((d: {
    ownerAddress:       string;
    signedAuthorization: Record<string, any>;
  }) => d)
  .handler(async ({ data }) => {
    const steps: { step: string; status: 'ok' | 'error'; detail: any }[] = [];

    try {
      // Step 1: Get fee quote so 1Shot can be paid for the upgrade tx gas
      const feeResult = await oneShotPost(1, 'relayer_getFeeData', {
        chainId: BASE_CHAIN_ID,
        token:   CONTRACTS.USDC,
      });
      const feeData = feeResult.response.result;
      steps.push({
        step:   '1. GET fee quote — relayer_getFeeData',
        status: feeData ? 'ok' : 'error',
        detail: feeResult,
      });
      if (!feeData) throw new Error('Could not get fee data from 1Shot');

      // Map signedAuthorization fields dynamically to make sure it matches EIP-7702 relayer specifications:
      const mappedAuth = {
        chainId: Number(data.signedAuthorization.chainId),
        address: data.signedAuthorization.address || data.signedAuthorization.contractAddress,
        nonce: Number(data.signedAuthorization.nonce),
        r: data.signedAuthorization.r,
        s: data.signedAuthorization.s,
        yParity: typeof data.signedAuthorization.yParity === 'number'
          ? data.signedAuthorization.yParity
          : (typeof data.signedAuthorization.v === 'bigint' || typeof data.signedAuthorization.v === 'number')
            ? (Number(data.signedAuthorization.v) === 27 ? 0 : Number(data.signedAuthorization.v) === 28 ? 1 : Number(data.signedAuthorization.v))
            : 0,
      };

      // Step 2: Submit type-4 (EIP-7702) transaction through 1Shot
      // 1Shot wraps the authorization in an EIP-7702 tx and pays the gas
      const txResult = await oneShotPost(2, 'relayer_send7702Transaction', {
        chainId: BASE_CHAIN_ID,
        context: feeData.context,
        // Fee payment to 1Shot so they cover gas
        feeTransaction: {
          to:    CONTRACTS.USDC,
          value: '0x0',
          data:  buildTransferCalldata(feeData.feeCollector as `0x${string}`, feeData.feeAmount),
        },
        // The EIP-7702 authorization that upgrades the EOA
        authorizationList: [mappedAuth],
        from: data.ownerAddress,
      });

      const taskId = txResult.response.result?.taskId ?? null;
      steps.push({
        step:   '2. SUBMIT 7702 upgrade — relayer_send7702Transaction',
        status: taskId ? 'ok' : 'error',
        detail: txResult,
      });

      // Step 3: Persist to Neon DB (marks this wallet as a smart account)
      if (taskId) {
        await db.insert(smartAccounts)
          .values({
            ownerAddress:        data.ownerAddress as `0x${string}`,
            smartAccountAddress: data.ownerAddress as `0x${string}`, // same address after 7702
          })
          .onConflictDoNothing();

        steps.push({
          step:   '3. RECORD smart account — Neon DB',
          status: 'ok',
          detail: { ownerAddress: data.ownerAddress, implementation: CONTRACTS.EIP7702StatelessDelegator },
        });
      }

      return {
        success: !!taskId,
        taskId,
        steps,
        summary: taskId
          ? `✅ EIP-7702 upgrade submitted! Task ID: ${taskId}`
          : '⚠️ 7702 submission returned no taskId — check step details.',
      };
    } catch (err: any) {
      steps.push({ step: 'Error', status: 'error', detail: err?.message });
      return { success: false, taskId: null, steps, summary: `❌ ${err?.message}` };
    }
  });

// ─── Server Fn 4: Execute subscription payment via 1Shot EIP-7710 ─────────────
export const executeSubscription = createServerFn({ method: 'POST' })
  .validator((d: {
    permissionContext: string;
    sessionPrivateKey: string;
    amountWei:         string;
    recipient:         string;
    subscriptionId?:   number;
  }) => d)
  .handler(async ({ data }) => {
    const steps: { step: string; status: 'ok' | 'error'; detail: any }[] = [];

    try {
      // Step 1: Get fee quote
      const feeResult = await oneShotPost(1, 'relayer_getFeeData', {
        chainId: BASE_CHAIN_ID,
        token:   CONTRACTS.USDC,
      });
      const feeData = feeResult.response.result;
      steps.push({
        step:   '1. GET fee quote — relayer_getFeeData',
        status: feeData ? 'ok' : 'error',
        detail: {
          ...feeResult,
          feeUSDC: feeData ? `${(Number(feeData.feeAmount) / 1_000_000).toFixed(6)} USDC` : 'n/a',
        },
      });
      if (!feeData) throw new Error(`1Shot getFeeData failed: ${JSON.stringify(feeResult.response.error)}`);

      // Step 2: Submit EIP-7710 bundle (fee + subscription payment)
      const txBody = {
        context: feeData.context,
        transactions: [
          // ① Gas fee to 1Shot relayer (paid in USDC — no ETH needed)
          { to: CONTRACTS.USDC, value: '0x0', data: buildTransferCalldata(feeData.feeCollector as `0x${string}`, feeData.feeAmount) },
          // ② Actual subscription payment to recipient
          { to: CONTRACTS.USDC, value: '0x0', data: buildTransferCalldata(data.recipient as `0x${string}`, data.amountWei) },
        ],
        // ERC-7715 permission context authorises both transfers from the smart account
        permissionContext: data.permissionContext,
      };
      const txResult = await oneShotPost(2, 'relayer_send7710Transaction', txBody);
      const taskId   = txResult.response.result?.taskId ?? null;

      steps.push({
        step:   '2. SUBMIT bundle — relayer_send7710Transaction',
        status: taskId ? 'ok' : 'error',
        detail: {
          request:  { ...txResult.request, params: { ...txResult.request.params, permissionContext: '[redacted]' } },
          response: txResult.response,
          taskId:   taskId ?? txResult.response.error?.message ?? 'failed',
        },
      });

      // Step 3: Advance nextRunTime in Neon DB
      if (data.subscriptionId) {
        const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, data.subscriptionId));
        if (sub) {
          const next = new Date(sub.nextRunTime);
          next.setSeconds(next.getSeconds() + sub.intervalSeconds);
          await db.update(subscriptions).set({ nextRunTime: next }).where(eq(subscriptions.id, data.subscriptionId));
          steps.push({ step: '3. ADVANCE nextRunTime — Neon DB', status: 'ok', detail: { nextRunTime: next.toISOString() } });
        }
      }

      return {
        success: true,
        taskId,
        steps,
        summary: taskId
          ? `✅ Relayed! Poll taskId ${taskId} for tx hash.`
          : '⚠️ Fee quoted. Real tx needs a live ERC-7715 permission context.',
      };
    } catch (err: any) {
      steps.push({ step: 'Error', status: 'error', detail: err?.message });
      return { success: false, taskId: null, steps, summary: `❌ ${err?.message}` };
    }
  });

// ─── Server Fn 5: Cron — process all due subscriptions ───────────────────────
export const processAllDueSubscriptions = createServerFn({ method: 'POST' })
  .validator((_: void) => _)
  .handler(async () => {
    const now = new Date();
    const due = await db.select().from(subscriptions).where(
      and(eq(subscriptions.isActive, true), lte(subscriptions.nextRunTime, now)),
    );
    const results = await Promise.allSettled(
      due.map(async (sub) => {
        const permCtx = typeof sub.permissionContext === 'string'
          ? sub.permissionContext : JSON.stringify(sub.permissionContext);
        const feeResult = await oneShotPost(1, 'relayer_getFeeData', { chainId: BASE_CHAIN_ID, token: CONTRACTS.USDC });
        const feeData   = feeResult.response.result;
        if (!feeData) throw new Error('Could not get fee data');
        const txResult  = await oneShotPost(2, 'relayer_send7710Transaction', {
          context: feeData.context,
          transactions: [
            { to: CONTRACTS.USDC, value: '0x0', data: buildTransferCalldata(feeData.feeCollector as `0x${string}`, feeData.feeAmount) },
            { to: CONTRACTS.USDC, value: '0x0', data: buildTransferCalldata(sub.recipientAddress as `0x${string}`, sub.amount) },
          ],
          permissionContext: permCtx,
        });
        const next = new Date(sub.nextRunTime);
        next.setSeconds(next.getSeconds() + sub.intervalSeconds);
        await db.update(subscriptions).set({ nextRunTime: next }).where(eq(subscriptions.id, sub.id));
        return { id: sub.id, taskId: txResult.response.result?.taskId, success: true };
      }),
    );
    const succeeded = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    return { processed: results.length, succeeded, failed: results.length - succeeded };
  });
