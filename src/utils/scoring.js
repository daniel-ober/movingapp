// src/utils/scoring.js

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

/**
 * computeScore(propertyLike) -> { score: number (0-100), breakdown: object }
 *
 * Inputs expected:
 *   propertyLike.scoreInputs: {
 *     commute, priceValue, neighborhood, layout, condition, light, noise (0-10)
 *     mustHaveMiss: boolean (subtract 25)
 *     dealBreaker: boolean (score becomes 0)
 *   }
 *
 * Safe-by-default:
 *  - Missing values become 5/10
 *  - Score is always 0–100
 */
export function computeScore(propertyLike = {}) {
  const si = propertyLike?.scoreInputs || {};

  const commute = clamp(si.commute ?? 5, 0, 10);
  const priceValue = clamp(si.priceValue ?? 5, 0, 10);
  const neighborhood = clamp(si.neighborhood ?? 5, 0, 10);
  const layout = clamp(si.layout ?? 5, 0, 10);
  const condition = clamp(si.condition ?? 5, 0, 10);
  const light = clamp(si.light ?? 5, 0, 10);
  const noise = clamp(si.noise ?? 5, 0, 10);

  const mustHaveMiss = !!si.mustHaveMiss;
  const dealBreaker = !!si.dealBreaker;

  // Base average (0–10)
  const avg =
    (commute +
      priceValue +
      neighborhood +
      layout +
      condition +
      light +
      noise) /
    7;

  // Convert to 0–100
  let score = Math.round(avg * 10);

  // Penalties
  if (mustHaveMiss) score = Math.max(0, score - 25);
  if (dealBreaker) score = 0;

  score = clamp(score, 0, 100);

  const breakdown = {
    inputs: {
      commute,
      priceValue,
      neighborhood,
      layout,
      condition,
      light,
      noise,
      mustHaveMiss,
      dealBreaker,
    },
    average10: Number(avg.toFixed(2)),
    baseScore100: Math.round(avg * 10),
    penaltyMustHaveMiss: mustHaveMiss ? 25 : 0,
    dealBreakerApplied: dealBreaker,
    finalScore: score,
  };

  return { score, breakdown };
}

// Optional default export (harmless, sometimes convenient)
export default computeScore;