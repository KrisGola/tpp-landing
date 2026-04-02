/**
 * POST /api/match
 *
 * Input:
 *   aiAnalysis  — output from /api/analyze (required)
 *   clientCity  — optional, used for location scoring
 *   clientRegion — optional
 *   topN        — how many results to return (default 3, max 5)
 *
 * Output:
 *   { matches: LawyerMatch[], meta: { total, legalArea, urgency, topN } }
 *
 * Data source: Supabase user_profiles WHERE tpp_is_listed = true
 * Falls back to mock data if NEXT_PUBLIC_SUPABASE_URL is not configured.
 */

import { rankLawyers } from '../../lib/matchingEngine';
import { checkRateLimit } from '../../lib/aiPipeline';

export const config = {
  api: { bodyParser: { sizeLimit: '8kb' } },
};

// ─────────────────────────────────────────────────────────
// SUPABASE QUERY
// ─────────────────────────────────────────────────────────

async function fetchListedLawyers() {
  // Only import Supabase when env vars are available
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[/api/match] Supabase not configured — using mock data');
    return getMockLawyers();
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      tpp_slug,
      tpp_specializations,
      tpp_city,
      tpp_region,
      tpp_rating,
      tpp_review_count,
      tpp_response_hours,
      tpp_availability,
      tpp_price_consult,
      tpp_price_hour,
      tpp_price_fixed,
      tpp_languages,
      tpp_is_listed
    `)
    .eq('tpp_is_listed', true)
    .limit(50);

  if (error) {
    console.error('[/api/match] Supabase query error:', error.message);
    return getMockLawyers();
  }

  return data ?? getMockLawyers();
}

// ─────────────────────────────────────────────────────────
// MOCK DATA (used when Supabase not configured)
// ─────────────────────────────────────────────────────────

function getMockLawyers() {
  return [
    {
      id: 'mock-ak',
      full_name: 'mec. Anna Kowalska',
      tpp_slug: 'anna-kowalska',
      tpp_specializations: ['Prawo pracy', 'Prawo pracownicze', 'Odwołanie od zwolnienia'],
      tpp_city: 'Warszawa',
      tpp_region: 'Mazowieckie',
      tpp_rating: 4.9,
      tpp_review_count: 63,
      tpp_response_hours: 1,
      tpp_availability: 'Dostępna dziś',
      tpp_price_consult: 'bezpłatna 15 min',
      tpp_price_hour: '280 PLN/godz.',
      tpp_price_fixed: 'od 800 PLN',
      tpp_is_listed: true,
    },
    {
      id: 'mock-pn',
      full_name: 'adw. Piotr Nowak',
      tpp_slug: 'piotr-nowak',
      tpp_specializations: ['Prawo cywilne', 'Umowy', 'Odszkodowania'],
      tpp_city: 'Kraków',
      tpp_region: 'Małopolskie',
      tpp_rating: 4.7,
      tpp_review_count: 41,
      tpp_response_hours: 3,
      tpp_availability: 'Dostępny jutro',
      tpp_price_consult: 'bezpłatna 30 min',
      tpp_price_hour: '320 PLN/godz.',
      tpp_price_fixed: 'od 1200 PLN',
      tpp_is_listed: true,
    },
    {
      id: 'mock-ms',
      full_name: 'radca pr. Marta Stawska',
      tpp_slug: 'marta-stawska',
      tpp_specializations: ['Prawo rodzinne', 'Rozwód', 'Alimenty'],
      tpp_city: 'Warszawa',
      tpp_region: 'Mazowieckie',
      tpp_rating: 4.8,
      tpp_review_count: 29,
      tpp_response_hours: 2,
      tpp_availability: 'Dostępna dziś',
      tpp_price_consult: 'bezpłatna 15 min',
      tpp_price_hour: '300 PLN/godz.',
      tpp_price_fixed: 'od 1000 PLN',
      tpp_is_listed: true,
    },
    {
      id: 'mock-jw',
      full_name: 'adw. Jakub Wiśniewski',
      tpp_slug: 'jakub-wisniewski',
      tpp_specializations: ['Prawo nieruchomości', 'Prawo lokalowe', 'Umowy najmu'],
      tpp_city: 'Wrocław',
      tpp_region: 'Dolnośląskie',
      tpp_rating: 4.6,
      tpp_review_count: 18,
      tpp_response_hours: 4,
      tpp_availability: 'Dostępny w tym tygodniu',
      tpp_price_consult: null,
      tpp_price_hour: '260 PLN/godz.',
      tpp_price_fixed: 'od 700 PLN',
      tpp_is_listed: true,
    },
    {
      id: 'mock-kd',
      full_name: 'mec. Katarzyna Dąbrowska',
      tpp_slug: 'katarzyna-dabrowska',
      tpp_specializations: ['Prawo pracy', 'Prawo rodzinne', 'Postępowanie sądowe'],
      tpp_city: 'Gdańsk',
      tpp_region: 'Pomorskie',
      tpp_rating: 4.85,
      tpp_review_count: 54,
      tpp_response_hours: 2,
      tpp_availability: 'Dostępna dziś',
      tpp_price_consult: 'bezpłatna 20 min',
      tpp_price_hour: '290 PLN/godz.',
      tpp_price_fixed: 'od 900 PLN',
      tpp_is_listed: true,
    },
  ];
}

// ─────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting (shared with /api/analyze)
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

  const { aiAnalysis, clientCity, clientRegion, topN: rawTopN } = req.body ?? {};

  // Validate aiAnalysis
  if (!aiAnalysis?.classification?.legalArea) {
    return res.status(400).json({
      error: 'aiAnalysis with classification.legalArea is required.',
    });
  }

  const topN = Math.min(5, Math.max(1, parseInt(rawTopN ?? 3, 10)));
  const clientContext = {
    city:   clientCity   ? String(clientCity).trim()   : null,
    region: clientRegion ? String(clientRegion).trim() : null,
  };

  try {
    const lawyers = await fetchListedLawyers();

    const matches = rankLawyers(lawyers, aiAnalysis, clientContext, topN);

    // Strip internal _scores in production
    const isProd = process.env.NODE_ENV === 'production';
    const cleaned = isProd
      ? matches.map(({ _scores, ...m }) => m)
      : matches;

    return res.status(200).json({
      matches: cleaned,
      meta: {
        total:     lawyers.length,
        returned:  cleaned.length,
        legalArea: aiAnalysis.classification.legalArea,
        urgency:   aiAnalysis.classification.urgencyLevel,
        topN,
        source:    process.env.NEXT_PUBLIC_SUPABASE_URL ? 'supabase' : 'mock',
      },
    });

  } catch (error) {
    console.error('[/api/match] Error:', {
      message: error.message,
      timestamp: new Date().toISOString(),
    });

    return res.status(500).json({
      error: 'Matching service temporarily unavailable.',
    });
  }
}
