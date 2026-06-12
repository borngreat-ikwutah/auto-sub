import { pgTable, serial, varchar, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const smartAccounts = pgTable('smart_accounts', {
  id: serial('id').primaryKey(),
  ownerAddress: varchar('owner_address', { length: 42 }).notNull().unique(),
  smartAccountAddress: varchar('smart_account_address', { length: 42 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  ownerAddress: varchar('owner_address', { length: 42 }).notNull(),
  recipientAddress: varchar('recipient_address', { length: 42 }).notNull(),
  amount: varchar('amount', { length: 255 }).notNull(), // Stored in string to avoid precision loss with large wei values
  tokenAddress: varchar('token_address', { length: 42 }).notNull(),
  intervalSeconds: integer('interval_seconds').notNull(),
  nextRunTime: timestamp('next_run_time').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  permissionContext: jsonb('permission_context'), // Stores the ERC-7715 context & signature for relayer
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  ownerAddress: varchar('owner_address', { length: 42 }).notNull(),
  role: varchar('role', { length: 10 }).notNull(), // 'user' or 'agent'
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
