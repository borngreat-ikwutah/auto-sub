AutoSub — Product Requirements Document
Budget-Scoped Recurring Payment Agent MetaMask Smart Accounts Kit × 1Shot API Hackathon | 3-Day Build

Overview
AutoSub lets a user grant a scoped, time-limited spending permission (ERC-7715) to an agent once. The agent then autonomously executes recurring USDC payments to a recipient on a fixed schedule via 1Shot's permissionless relayer (EIP-7710 delegation execution) — no further signatures required.
One-line pitch: "Set it once. Let the agent pay your subscription, automatically, within the limits you set."
Goals

Satisfy all 4 qualification requirements with a working, demoable flow
Single recipient, single token (USDC on Base/Linea testnet — pick per 1Shot/MetaMask support), fixed interval
Demo: grant permission once → trigger 2-3 automated executions without re-signing

Non-goals (cut for time): multi-task agent logic, Venice AI function-calling, multi-token support, production-grade scheduling (cron acceptable, manual "tick" button acceptable for demo). 3. User Flow

User connects wallet (MetaMask Flask, signer-agnostic via Smart Accounts Kit)
User sets: recipient address, amount per period (e.g. 5 USDC), period (e.g. 24h, but demo-compressed to 1 min)
User grants ERC-7715 permission (spending limit + period) via MetaMask Smart Accounts Kit
Backend stores delegation
Agent loop checks if payment is due → if yes, calls 1Shot relayer to execute the delegated transfer (EIP-7710)
UI shows execution history (tx hashes, amounts, timestamps)
Demo: click "Advance time" or wait for interval → see automatic payment fire
Architecture

text┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
│ Frontend │ ERC- │ Backend │ EIP- │ 1Shot │
│ React/Vite │ 7715 │ Node/Hono/TS │ 7710 │ Relayer │
│ MetaMask Flask │ ──────► │ - Store delegation│ ──────► │ (gasless exec) │
│ Smart Accounts │ permit │ - Agent scheduler│ call │ │
│ Kit │ │ - Execution log │ │ │
└─────────────────┘ └──────────────────┘ └─────────────────┘

Tech Stack
Layer Tech Frontend React + Vite, MetaMask Smart Accounts Kit, MetaMask Flask Backend Node.js, Hono, TypeScript Permissions ERC-7715 (request via Smart Accounts Kit) Execution EIP-7710 delegation via 1Shot Permissionless Relayer (JSON-RPC) Token USDC (testnet) Storage In-memory or SQLite (avoid extra infra) Scheduler setInterval loop or manual "tick" endpoint for demo
Day-by-Day Plan
Day 1 — Permission Flow

Set up React/Vite frontend, install Smart Accounts Kit, connect MetaMask Flask
Build "Create AutoSub" form: recipient, amount, period
Implement ERC-7715 permission request (spending limit + periodic allowance) for USDC
On success, send delegation payload to backend /delegations endpoint
Checkpoint: User can grant permission and backend logs it

Day 2 — Execution via 1Shot

Install 1Shot relayer skill, set up JSON-RPC integration
Implement /execute endpoint: given a stored delegation, check if due, call 1Shot relayer to execute EIP-7710 transfer within granted allowance
Build agent loop (interval-based) that calls /execute for active delegations
Test end-to-end: permission grant → automated execution → tx confirmation
Checkpoint: One full automated payment cycle works on testnet

Day 3 — UI Polish, Demo, Submission

Execution history UI (tx hash, amount, timestamp, link to explorer)
"Tick now" debug button to force-trigger execution for demo
Error handling: allowance exceeded, period not yet elapsed
Record demo video showing: grant permission once → 2-3 automatic executions, no re-signing
Write README, deploy frontend (Vercel) + backend (Railway/Render)
Submit

Key Risks & Mitigations
Risk Mitigation ERC-7715 permission API unfamiliarity Start Day 1, reference Smart Accounts Kit examples/docs first 1Shot relayer setup friction Install relayer skill immediately, test with a trivial tx before integrating Testnet USDC/faucet delays Get test tokens Day 1 before building execution logic Time compression for demo Use short period (1 min) for demo config, document real-world period separately
Success Criteria (Qualification Checklist)

Uses MetaMask Smart Accounts Kit for ERC-7715 permission request
Uses EIP-7710 delegation execution via 1Shot relayer
Demo video shows the integration working in the main app flow
Permission granted once; subsequent payments require no user signature

Stretch (only if Day 3 finishes early)

Venice AI: simple chat interface to set up the AutoSub via natural language ("pay 5 USDC to X every day")
Pause/cancel delegation UI

i need a full workflow of how i can integrate this

If you want to **maximize hackathon points**, don't build AutoSub as just a recurring payment scheduler. Make the **AI agent the primary interface** and use **Smart Accounts + ERC-7715 permissions** underneath.

The judges will likely see dozens of "set recurring payment" demos. An AI-powered autonomous subscription manager is more differentiated.

## Better User Flow

Instead of:

```text
Fill form
→ Grant permission
→ Payment executes
```

Do:

```text
Chat with AI
→ AI creates payment plan
→ User approves
→ ERC-7715 permission granted
→ AI manages subscription automatically
```

Example:

User says:

> Pay 5 USDC to Netflix every week.

AI responds:

> I can create a recurring payment:
>
> - Recipient: Netflix Wallet
> - Amount: 5 USDC
> - Frequency: Weekly
> - Monthly Cap: 25 USDC
>
> Approve?

User clicks approve.

Smart Account permission request appears.

User signs once.

Done.

---

# Where Smart Accounts Fit

Your Smart Account becomes the wallet that executes delegated actions.

```text
User EOA
   │
   ▼
MetaMask Smart Account
   │
   ▼
ERC-7715 Permission
   │
   ▼
AI Agent
   │
   ▼
1Shot Relayer
```

The AI never controls funds directly.

The AI only operates within:

```text
Amount per payment
Frequency
Maximum budget
Expiration date
```

defined by the user.

---

# AI Architecture

```text
Frontend
   │
   ▼
Chat Interface
   │
   ▼
AI Service
   │
   ▼
Tool Calls
   ├── Create Subscription
   ├── Cancel Subscription
   ├── Check Budget
   └── Trigger Payment
```

The AI's job is simply translating language into structured actions.

Example:

```json
{
  "action": "create_subscription",
  "recipient": "0x123",
  "amount": 5,
  "frequency": "weekly",
  "budget": 25
}
```

---

# Smart Account Creation

Using MetaMask Smart Accounts Kit:

```ts
const smartAccount = await createSmartAccount(...)
```

You'll typically store:

```ts
{
  userAddress, smartAccountAddress;
}
```

inside Neon.

Table:

```sql
CREATE TABLE smart_accounts (
  id UUID PRIMARY KEY,
  user_address TEXT NOT NULL,
  smart_account_address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

# AI Tables

### subscriptions

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,

  user_address TEXT,

  recipient_address TEXT,

  amount_per_period BIGINT,

  interval_seconds INTEGER,

  monthly_cap BIGINT,

  spent_amount BIGINT DEFAULT 0,

  delegation_id TEXT,

  active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### messages

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,

  user_address TEXT,

  role TEXT,

  content TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
```

This lets you replay the AI conversation during the demo.

---

# AI Features Worth Showing

### 1. Subscription Creation

User:

> Pay 5 USDC every day to 0x123...

AI:

```json
{
  "action": "create_subscription"
}
```

Backend creates subscription.

---

### 2. Budget Analysis

User:

> How much have I spent this month?

AI queries Neon.

Response:

> You spent 40 USDC across 8 automated payments.

---

### 3. Risk Detection

User:

> Create a subscription for 500 USDC daily.

AI:

> This exceeds your typical spending pattern. Are you sure?

Hackathon judges love this kind of feature.

---

### 4. Cancel Subscription

User:

> Stop paying Netflix.

AI:

```json
{
  "action": "cancel_subscription"
}
```

Backend updates DB.

---

# LLM Choices

For a hackathon:

- OpenAI GPT-5.5
- OpenAI GPT-4.1-mini
- OpenRouter models
- Venice AI (if required by a bounty)

You don't need agent frameworks.

Just:

```text
User Message
→ LLM
→ Structured JSON
→ Backend Action
```

is enough.

---

# Demo Script

1. Connect MetaMask.

2. Smart Account created.

3. User types:

   > Pay 5 USDC every minute to this wallet.

4. AI summarizes the plan.

5. User approves.

6. ERC-7715 permission popup.

7. Sign once.

8. Subscription saved in Neon.

9. Click "Run Agent".

10. 1Shot executes payment.

11. Payment appears in history.

12. Ask:

    > How much have I spent?

13. AI reads from Neon and answers.

This demonstrates:

- AI Agent
- Smart Accounts
- ERC-7715
- EIP-7710
- 1Shot Relayer
- Autonomous execution
- Database persistence

which is a much stronger hackathon story than a simple recurring-payment app.
