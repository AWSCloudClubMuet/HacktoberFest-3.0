import { Router, Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AiQuerySchema } from '../lib/validation';
import { validationError } from '../lib/errors';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

function getClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

// POST /ai/chat
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = AiQuerySchema.safeParse(req.body);
    if (!parsed.success) throw validationError('Validation failed', parsed.error.issues);

    const { message, context } = parsed.data;
    const client = getClient();

    if (!client) {
      res.status(503).json({
        success: false,
        message: 'AI assistant is not configured. Please add GEMINI_API_KEY to the backend .env file.',
      });
      return;
    }

    // Gather relevant context from DB
    let contextBlocks: string[] = [];

    // Always include the disclaimer
    contextBlocks.push(
      'IMPORTANT: All prices referenced in this system are sample demo prices — not live market data. ' +
      'Always clearly state this in any response about prices.'
    );

    if (context?.cropId) {
      const crop = await prisma.crop.findUnique({ where: { id: context.cropId } });
      if (crop) {
        contextBlocks.push(`Current crop context: ${crop.name} (unit: ${crop.unit})`);
        // Get latest prices for this crop
        const prices = await prisma.price.findMany({
          where: { cropId: context.cropId },
          include: { market: { select: { name: true, district: true } } },
          orderBy: { date: 'desc' },
          take: 30,
        });
        if (prices.length > 0) {
          const priceText = prices
            .slice(0, 10)
            .map((p) => `${p.market.name} on ${p.date.toISOString().slice(0,10)}: PKR ${Number(p.price)} per ${p.unit}`)
            .join('\n');
          contextBlocks.push(`Recent sample prices for ${crop.name}:\n${priceText}`);
        }
      }
    }

    if (context?.marketId) {
      const market = await prisma.market.findUnique({ where: { id: context.marketId } });
      if (market) contextBlocks.push(`Market context: ${market.name}, ${market.district}`);
    }

    if (context?.listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: context.listingId },
        include: { crop: true, market: true },
      });
      if (listing) {
        contextBlocks.push(
          `Listing context: ${listing.crop.name}, quantity ${Number(listing.quantity)} ${listing.unit}, ` +
          `asking PKR ${Number(listing.askingPricePerUnit)} per unit, market: ${listing.market.name}, ` +
          `status: ${listing.status}. Grade: ${listing.grade}.`
        );
      }
    }

    // Build system prompt
    const systemPrompt = `You are the saa-wak (ساوڪ) AI Market Assistant — a helpful agricultural market guide for farmers and buyers in Sindh, Pakistan.

Your role is to help users understand crop prices, marketplace trends, and farming decisions.

Key rules:
1. Always state clearly that all prices shown are SAMPLE DEMO PRICES, not real-time market data.
2. Never invent prices or market data not provided in context.
3. Be concise, practical, and use PKR (Pakistani Rupee) units consistently.
4. If asked about listing descriptions or messages, generate drafts that users can review and send manually — never auto-send anything.
5. If data is insufficient, say so honestly rather than guessing.

${contextBlocks.join('\n\n')}`;

    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 1024,
        temperature: 0.4,
      },
    });

    const text = response.text ?? 'Sorry, I could not generate a response. Please try again.';

    res.json({ success: true, data: { response: text, disclaimer: 'All prices referenced are sample demo data, not live market quotations.' } });
  } catch (err: unknown) {
    // Handle Gemini API errors gracefully
    const msg = err instanceof Error ? err.message : 'AI service error';
    if (msg.includes('API_KEY') || msg.includes('quota') || msg.includes('rate')) {
      res.status(503).json({
        success: false,
        message: 'AI service is temporarily unavailable. Please try again later.',
      });
      return;
    }
    next(err);
  }
});

export default router;
