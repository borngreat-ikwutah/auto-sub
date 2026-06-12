import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { chatMessages } from '@/db/schema'
import OpenAI from 'openai'

// Initialize Venice AI via OpenAI compatible SDK
const openai = new OpenAI({
  apiKey: process.env.VENICE_API_KEY || 'missing_key',
  baseURL: 'https://api.venice.ai/api/v1',
})

export const parseAgentIntent = createServerFn({ method: 'POST' })
  .validator((d: { message: string; ownerAddress: string }) => d)
  .handler(async ({ data }) => {
    // 1. Insert user message into Neon DB
    await db.insert(chatMessages).values({
      ownerAddress: data.ownerAddress,
      role: 'user',
      content: data.message,
    })

    // 2. Setup strict system prompt for Venice AI
    const systemPrompt = `You are an AI assistant for a Web3 Auto-Subscription dApp called AutoSub. 
The user will ask to create a recurring payment (e.g. "Pay 5 USDC to Netflix every week").
You MUST extract the parameters and return ONLY a strict JSON object with no markdown formatting.
JSON Schema:
{
  "recipient": "string (the extracted name or address)",
  "amount": "string (e.g. '5.00 USDC')",
  "frequency": "string (e.g. 'Weekly', 'Daily', 'Monthly')",
  "monthlyCap": "string (e.g. '25.00 USDC', calculate based on frequency and amount)"
}`;

    let parsedData = {
      recipient: "Unknown",
      amount: "0.00 USDC", 
      frequency: "Unknown",
      monthlyCap: "0.00 USDC"
    };

    try {
      if (process.env.VENICE_API_KEY) {
        const response = await openai.chat.completions.create({
          model: 'openai-gpt-55',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: data.message }
          ],
        });

        const rawJson = response.choices[0]?.message?.content || "{}";
        // Ensure no markdown block formatting ruins JSON.parse
        const cleanedJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleanedJson);
      } else {
        console.warn("VENICE_API_KEY missing, using mock fallback.");
        parsedData = {
          recipient: "0xMockAddress (Netflix)",
          amount: "5.00 USDC",
          frequency: "Weekly",
          monthlyCap: "25.00 USDC"
        };
      }
    } catch (error) {
      console.error("Venice AI Error:", error);
    }

    const aiResponseText = `I can create a recurring payment:\nRecipient: ${parsedData.recipient}\nAmount: ${parsedData.amount}\nFrequency: ${parsedData.frequency}\n\nApprove this delegation?`

    // 3. Insert Agent response into Neon DB
    await db.insert(chatMessages).values({
      ownerAddress: data.ownerAddress,
      role: 'agent',
      content: aiResponseText,
    })

    // 4. Return structured response to the frontend client
    return { 
      success: true, 
      text: aiResponseText,
      structuredData: parsedData 
    }
  })
