/**
 * POST /api/analyze
 *
 * Input:  CaseInput  { userText, category, hasPismo, deadline }
 * Output: AIOutput   { classification, extraction, summary, actionPlan }
 *
 * Always returns a consistent structure — even on AI failure (fallback).
 */

import { analyzeCaseWithAI, checkRateLimit } from '../../lib/aiPipeline';
import { getFallbackOutput } from '../../lib/fallback';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4kb',
    },
  },
};

export default async function handler(req, res) {
  // ── Method guard ──────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Rate limiting ─────────────────────────────────────
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfterMinutes: 60,
    });
  }

  // ── Input validation ──────────────────────────────────
  const { userText, category, hasPismo, deadline } = req.body ?? {};

  if (!userText || typeof userText !== 'string' || userText.trim().length < 15) {
    return res.status(400).json({
      error: 'userText is required and must be at least 15 characters.',
    });
  }

  // Sanitise inputs (strip to expected enum values)
  const cleanCategory = ['praca', 'rodzina', 'umowa', 'mieszkanie', 'sad', 'inne'].includes(category)
    ? category
    : 'inne';

  const cleanHasPismo = ['tak', 'nie', 'nie_wiem'].includes(hasPismo) ? hasPismo : null;
  const cleanDeadline = ['pilne', 'ok', 'nie'].includes(deadline) ? deadline : null;

  // ── AI Pipeline ───────────────────────────────────────
  try {
    const result = await analyzeCaseWithAI({
      userText: userText.trim().slice(0, 600), // enforce max length
      category: cleanCategory,
      hasPismo: cleanHasPismo,
      deadline: cleanDeadline,
    });

    // Attach metadata
    result._meta = {
      fallback: false,
      category: cleanCategory,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(result);

  } catch (error) {
    // Log for monitoring — never expose internals to client
    console.error('[/api/analyze] AI pipeline error:', {
      message: error.message,
      category: cleanCategory,
      timestamp: new Date().toISOString(),
    });

    // Always return a usable fallback — never a raw error
    const fallback = getFallbackOutput(cleanCategory);
    fallback._meta = {
      fallback: true,
      category: cleanCategory,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(fallback);
  }
}
