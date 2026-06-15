import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { chatMessages } from '@/db/schema'

// ─── Pure local intent parser — no external AI needed ─────────────────────────
// Handles patterns like:
//   "Pay 5 USDC to Netflix every week"
//   "Send 9.99 USDC to 0xAbc monthly"
//   "Subscribe to Spotify for 15 USDC weekly"

function parseIntent(message: string) {
  const text = message.trim();

  // ── Amount ───────────────────────────────────────────────────────────────────
  // Match: "5 USDC", "9.99 USDC", "5", "$5"
  const amountMatch = text.match(/\$?(\d+(?:\.\d+)?)\s*(?:USDC|usdc|usd)?/);
  const amountNum   = amountMatch ? parseFloat(amountMatch[1]) : 5;
  const amount      = `${amountNum.toFixed(2)} USDC`;

  // ── Recipient ─────────────────────────────────────────────────────────────────
  // Match after "to", "pay", "send to", "for" keywords
  // Also handle Ethereum addresses (0x...)
  let recipient = 'Unknown';
  const ethAddrMatch = text.match(/0x[a-fA-F0-9]{40}/);
  if (ethAddrMatch) {
    recipient = ethAddrMatch[0];
  } else {
    // Grab 1–2 words after "to" or "pay" / "send" / "for"
    const recipientMatch = text.match(
      /(?:^|\s)(?:to|pay(?:ing)?|send(?:ing)?\s+to|subscribe\s+to|subscription\s+(?:for|to))\s+([A-Za-z0-9._-]+(?:\s+[A-Za-z0-9._-]+)?)/i
    );
    if (recipientMatch) {
      // Filter out amount words so "5" doesn't become the recipient
      const candidate = recipientMatch[1].trim();
      if (!/^\d/.test(candidate)) recipient = candidate;
    }
    // Fallback: first capitalised word that isn't a keyword
    if (recipient === 'Unknown') {
      const keywords = new Set(['pay', 'send', 'usdc', 'usd', 'every', 'weekly', 'daily', 'monthly', 'subscribe', 'subscription', 'for', 'to', 'the', 'a', 'an']);
      const words = text.split(/\s+/);
      for (const w of words) {
        const clean = w.replace(/[^A-Za-z0-9]/g, '');
        if (clean.length > 1 && /^[A-Z]/.test(clean) && !keywords.has(clean.toLowerCase())) {
          recipient = clean;
          break;
        }
      }
    }
  }

  // ── Frequency ─────────────────────────────────────────────────────────────────
  let frequency = 'Weekly';
  if (/\b(daily|every\s+day|per\s+day)\b/i.test(text))        frequency = 'Daily';
  else if (/\b(bi-?weekly|every\s+two\s+weeks|biweekly)\b/i.test(text)) frequency = 'Bi-Weekly';
  else if (/\b(weekly|every\s+week|per\s+week)\b/i.test(text)) frequency = 'Weekly';
  else if (/\b(monthly|every\s+month|per\s+month)\b/i.test(text)) frequency = 'Monthly';

  // ── Monthly Cap ───────────────────────────────────────────────────────────────
  const multiplier =
    frequency === 'Daily'     ? 30 :
    frequency === 'Bi-Weekly' ? 2  :
    frequency === 'Weekly'    ? 4  : 1;
  const monthlyCap = `${(amountNum * multiplier).toFixed(2)} USDC`;

  return { recipient, amount, frequency, monthlyCap };
}

// ─── Server function ───────────────────────────────────────────────────────────
export const parseAgentIntent = createServerFn({ method: 'POST' })
  .validator((d: { message: string; ownerAddress: string }) => d)
  .handler(async ({ data }) => {
    // 1. Persist user message in Neon DB
    await db.insert(chatMessages).values({
      ownerAddress: data.ownerAddress,
      role: 'user',
      content: data.message,
    })

    // 2. Parse locally (no external API)
    const structuredData = parseIntent(data.message);

    const responseText =
      `I can create a recurring payment:\n` +
      `Recipient: ${structuredData.recipient}\n` +
      `Amount: ${structuredData.amount}\n` +
      `Frequency: ${structuredData.frequency}\n\n` +
      `Approve this delegation?`;

    // 3. Persist agent response in Neon DB
    await db.insert(chatMessages).values({
      ownerAddress: data.ownerAddress,
      role: 'agent',
      content: responseText,
    })

    return {
      success: true,
      text: responseText,
      structuredData,
    }
  })
