/**
 * TPP Matching Engine
 *
 * Scores lawyers against a client case using AI analysis output.
 *
 * Scoring weights:
 *   specialization  50%  — does lawyer cover the legal area?
 *   location        20%  — same city / region
 *   rating          20%  — tpp_rating normalized to 5.0
 *   availability    10%  — response time / availability flag
 *
 * Returns top N lawyers sorted by score descending.
 */

// ─────────────────────────────────────────────────────────
// SPECIALIZATION MAPPING
// Maps AI legalArea values → TPP specialization tags
// ─────────────────────────────────────────────────────────

const LEGAL_AREA_TAGS = {
  prawo_pracy:          ['Prawo pracy', 'Prawo pracownicze', 'Odwołanie od zwolnienia'],
  prawo_rodzinne:       ['Prawo rodzinne', 'Rozwód', 'Alimenty', 'Opieka nad dziećmi'],
  prawo_cywilne:        ['Prawo cywilne', 'Umowy', 'Odszkodowania', 'Windykacja'],
  postepowanie_sadowe:  ['Prawo procesowe', 'Postępowanie sądowe', 'Odwołania'],
  prawo_nieruchomosci:  ['Prawo nieruchomości', 'Prawo lokalowe', 'Umowy najmu'],
  inne:                 [],
};

const URGENCY_BOOST = {
  critical: 1.15,
  high:     1.08,
  medium:   1.0,
  low:      1.0,
};

// ─────────────────────────────────────────────────────────
// SCORE COMPONENTS
// ─────────────────────────────────────────────────────────

/**
 * Specialization score (0–1)
 * Exact match = 1.0, partial overlap = 0.5, no match = 0
 */
function scoreSpecialization(lawyerSpecs, legalArea) {
  if (!lawyerSpecs?.length) return 0;

  const relevantTags = LEGAL_AREA_TAGS[legalArea] ?? [];
  if (!relevantTags.length) return 0.3; // 'inne' — neutral score

  const normalized = lawyerSpecs.map(s => s.toLowerCase());
  const matches = relevantTags.filter(tag =>
    normalized.some(s => s.includes(tag.toLowerCase()) || tag.toLowerCase().includes(s))
  );

  if (matches.length === 0) return 0;
  if (matches.length >= 2) return 1.0;
  return 0.5;
}

/**
 * Location score (0–1)
 * Same city = 1.0, same region = 0.6, different = 0.2
 */
function scoreLocation(lawyerCity, lawyerRegion, clientCity, clientRegion) {
  if (!clientCity && !clientRegion) return 0.5; // client didn't specify — neutral

  const city1 = lawyerCity?.toLowerCase().trim();
  const city2 = clientCity?.toLowerCase().trim();
  const region1 = lawyerRegion?.toLowerCase().trim();
  const region2 = clientRegion?.toLowerCase().trim();

  if (city1 && city2 && city1 === city2) return 1.0;
  if (region1 && region2 && region1 === region2) return 0.6;
  return 0.2;
}

/**
 * Rating score (0–1)
 * Normalized from 1–5 scale
 */
function scoreRating(rating, reviewCount) {
  if (!rating) return 0.5; // no rating yet — neutral

  const normalized = Math.max(0, Math.min(1, (rating - 1) / 4));

  // Dampen score for very few reviews
  if (reviewCount < 3) return normalized * 0.7;
  if (reviewCount < 10) return normalized * 0.85;
  return normalized;
}

/**
 * Availability score (0–1)
 * Based on response time and availability flag
 */
function scoreAvailability(responseHours, availability) {
  let score = 0.5; // baseline

  if (availability?.toLowerCase().includes('dziś')) score = 1.0;
  else if (availability?.toLowerCase().includes('jutro')) score = 0.8;
  else if (availability) score = 0.6;

  // Adjust by response time
  if (responseHours !== null && responseHours !== undefined) {
    if (responseHours <= 1)  score = Math.max(score, 0.95);
    else if (responseHours <= 4)  score = Math.max(score, 0.8);
    else if (responseHours <= 24) score = Math.max(score, 0.6);
    else score = Math.min(score, 0.4);
  }

  return Math.min(1, score);
}

// ─────────────────────────────────────────────────────────
// EXPLANATION GENERATOR
// ─────────────────────────────────────────────────────────

function buildExplanation(lawyer, scores, legalArea) {
  const lines = [];

  if (scores.specialization >= 0.8) {
    const tags = (LEGAL_AREA_TAGS[legalArea] ?? []).slice(0, 2).join(', ');
    lines.push(`Specjalizuje się w: ${tags || legalArea}`);
  }

  if (scores.rating >= 0.85 && lawyer.tpp_review_count >= 10) {
    lines.push(`Ocena ${lawyer.tpp_rating}/5 na podstawie ${lawyer.tpp_review_count} opinii`);
  }

  if (scores.location >= 0.8) {
    lines.push(`Pracuje w ${lawyer.tpp_city}`);
  }

  if (scores.availability >= 0.9) {
    lines.push(lawyer.tpp_availability ?? 'Dostępny dziś');
  } else if (lawyer.tpp_response_hours && lawyer.tpp_response_hours <= 4) {
    lines.push(`Odpowiada w ciągu ${lawyer.tpp_response_hours}h`);
  }

  return lines.length ? lines : ['Dobry match dla Twojej sprawy'];
}

// ─────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────

/**
 * Score and rank lawyers against a client case.
 *
 * @param {object[]} lawyers         - Array of user_profiles rows with tpp_* columns
 * @param {object}   aiAnalysis      - Output from /api/analyze
 * @param {object}   [clientContext] - Optional: { city, region }
 * @param {number}   [topN=3]        - How many results to return
 * @returns {object[]}               - Top N lawyers with scores and explanations
 */
export function rankLawyers(lawyers, aiAnalysis, clientContext = {}, topN = 3) {
  if (!lawyers?.length) return [];

  const legalArea = aiAnalysis?.classification?.legalArea ?? 'inne';
  const urgency   = aiAnalysis?.classification?.urgencyLevel ?? 'medium';
  const urgencyMultiplier = URGENCY_BOOST[urgency] ?? 1.0;

  const scored = lawyers.map(lawyer => {
    const scores = {
      specialization: scoreSpecialization(lawyer.tpp_specializations, legalArea),
      location:       scoreLocation(
                        lawyer.tpp_city, lawyer.tpp_region,
                        clientContext.city, clientContext.region
                      ),
      rating:         scoreRating(lawyer.tpp_rating, lawyer.tpp_review_count),
      availability:   scoreAvailability(lawyer.tpp_response_hours, lawyer.tpp_availability),
    };

    // Weighted total
    const raw =
      scores.specialization * 0.50 +
      scores.location       * 0.20 +
      scores.rating         * 0.20 +
      scores.availability   * 0.10;

    const total = Math.min(1, raw * urgencyMultiplier);

    return {
      id:           lawyer.id,
      slug:         lawyer.tpp_slug,
      displayName:  lawyer.full_name,
      city:         lawyer.tpp_city,
      specializations: lawyer.tpp_specializations ?? [],
      rating:       lawyer.tpp_rating,
      reviewCount:  lawyer.tpp_review_count,
      responseHours: lawyer.tpp_response_hours,
      availability: lawyer.tpp_availability,
      priceConsult: lawyer.tpp_price_consult,
      priceHour:    lawyer.tpp_price_hour,
      matchScore:   Math.round(total * 100),         // 0–100
      matchGrade:   total >= 0.8 ? 'Świetny match'
                  : total >= 0.6 ? 'Dobry match'
                  : 'Możliwy match',
      explanation:  buildExplanation(lawyer, scores, legalArea),
      _scores:      scores,                          // debug only, strip in prod
    };
  });

  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topN);
}
