import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { subscriptions, smartAccounts } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const createDelegation = createServerFn({ method: 'POST' })
  .validator((d: { 
    ownerAddress: string;
    recipientAddress: string;
    amountWei: string;
    intervalSeconds: number;
    tokenAddress: string;
    permissionContext: any;
    sessionPrivateKey: string;
  }) => d)
  .handler(async ({ data }) => {
    const nextRunTime = new Date();
    nextRunTime.setSeconds(nextRunTime.getSeconds() + data.intervalSeconds);

    const [inserted] = await db.insert(subscriptions).values({
      ownerAddress: data.ownerAddress,
      recipientAddress: data.recipientAddress,
      amount: data.amountWei,
      tokenAddress: data.tokenAddress,
      intervalSeconds: data.intervalSeconds,
      nextRunTime: nextRunTime,
      isActive: true,
      permissionContext: data.permissionContext,
    }).returning();

    return { success: true, delegationId: inserted.id };
  });

export const getDelegations = createServerFn({ method: 'GET' })
  .validator((ownerAddress: string) => ownerAddress)
  .handler(async ({ data: ownerAddress }) => {
    const records = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.ownerAddress, ownerAddress))
      .orderBy(desc(subscriptions.createdAt));
      
    return records.map(r => ({
      id: r.id,
      recipientAddress: r.recipientAddress,
      amount: r.amount,
      intervalSeconds: r.intervalSeconds,
      isActive: r.isActive,
      nextRunTime: r.nextRunTime.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }));
  });

export const getDashboardStats = createServerFn({ method: 'GET' })
  .validator((ownerAddress: string) => ownerAddress)
  .handler(async ({ data: ownerAddress }) => {
    const all = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.ownerAddress, ownerAddress));

    const active = all.filter(s => s.isActive);
    const activeCount = active.length;

    // Calculate total monthly budget from active subscriptions (convert wei USDC -> human)
    const totalMonthlyBudgetWei = active.reduce((sum, s) => {
      const amountWei = BigInt(s.amount);
      const secondsPerMonth = 30 * 24 * 60 * 60;
      const runsPerMonth = Math.max(1, Math.round(secondsPerMonth / s.intervalSeconds));
      return sum + amountWei * BigInt(runsPerMonth);
    }, 0n);

    // Budget used = all non-active subscriptions' historical spend (rough estimate)
    const totalSpentWei = all
      .filter(s => !s.isActive)
      .reduce((sum, s) => sum + BigInt(s.amount), 0n);

    const toUsdc = (wei: bigint) => (Number(wei) / 1_000_000).toFixed(2);

    // Check if upgraded to smart account
    const accounts = await db.select()
      .from(smartAccounts)
      .where(eq(smartAccounts.ownerAddress, ownerAddress));
    const isSmartAccount = accounts.length > 0;

    return {
      activeCount,
      totalMonthly: toUsdc(totalMonthlyBudgetWei),
      budgetUsed: toUsdc(totalSpentWei),
      isSmartAccount,
    };
  });

export const cancelDelegation = createServerFn({ method: 'POST' })
  .validator((d: { id: number; ownerAddress: string }) => d)
  .handler(async ({ data }) => {
    await db.update(subscriptions)
      .set({ isActive: false })
      .where(
        and(
          eq(subscriptions.id, data.id),
          eq(subscriptions.ownerAddress, data.ownerAddress)
        )
      );
    return { success: true };
  });

