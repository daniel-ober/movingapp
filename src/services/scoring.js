// src/utils/scoring.js

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function toNum(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

/**
 * computeScore(propertyLike)
 *
 * Expects:
 *   propertyLike.scoreInputs = {
 *     commute, priceValue, neighborhood, layout, condition, light, noise (0-10 each),
 *     mustHaveMiss (bool),
 *     dealBreaker (bool),
 *     scoringNotes (string)
 *   }
 *
 * Returns:
 *   { score: 0-100 integer, breakdown: {...} }
 */
export function computeScore(propertyLike = {}) {
  const si = propertyLike.scoreInputs || {};

  const dealBreaker = !!si.dealBreaker;
  const mustHaveMiss = !!si.mustHaveMiss;

  // 0–10 sliders
  const commute = clamp(si.commute, 0, 10);
  const priceValue = clamp(si.priceValue, 0, 10);
  const neighborhood = clamp(si.neighborhood, 0, 10);
  const layout = clamp(si.layout, 0, 10);
  const condition = clamp(si.condition, 0, 10);
  const light = clamp(si.light, 0, 10);
  const noise = clamp(si.noise, 0, 10);

  // Weighting (tweak later anytime)
  const weights = {
    commute: 1.6,
    priceValue: 1.5,
    neighborhood: 1.5,
    layout: 1.2,
    condition: 1.1,
    light: 0.7,
    noise: 0.4,
  };

  const weightedSum =
    commute * weights.commute +
    priceValue * weights.priceValue +
    neighborhood * weights.neighborhood +
    layout * weights.layout +
    condition * weights.condition +
    light * weights.light +
    noise * weights.noise;

  const weightTotal = Object.values(weights).reduce((a, b) => a + b, 0);

  // Convert to 0–100
  let score100 = (weightedSum / (10 * weightTotal)) * 100;

  // Penalties
  const mustHavePenalty = mustHaveMiss ? 25 : 0;

  if (dealBreaker) {
    score100 = 0;
  } else {
    score100 = score100 - mustHavePenalty;
  }

  const finalScore = clamp(Math.round(score100), 0, 100);

  return {
    score: finalScore,
    breakdown: {
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
      weights,
      weightTotal: toNum(weightTotal, 0),
      baseScore: clamp(Math.round((weightedSum / (10 * weightTotal)) * 100), 0, 100),
      penalties: {
        mustHavePenalty,
        dealBreaker: dealBreaker ? "score forced to 0" : "no",
      },
      finalScore,
    },
  };
}