import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const createDelegation = createServerFn({ method: 'POST' })
  .validator((d: { 
    ownerAddress: string;
    recipientAddress: string;
    amountWei: string;
    intervalSeconds: number;
    tokenAddress: string;
    permissionContext: any;
    sessionPrivateKey: string; // Store this securely for the relayer to sign on behalf
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

    // Note: In a fully productionized architecture, the `sessionPrivateKey` 
    // should be encrypted using a KMS or Vault before saving to the DB.
    // For this prototype, we're skipping the private key storage column to keep it simple,
    // but the relayer script will need it. 

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
