// src/utils/scoring.js

/**
 * Scoring model (0–100).
 *
 * You can adjust weights and formulas easily.
 * Current inputs are normalized 0–10 (except toggles).
 */

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function to10(n) {
  return clamp(n, 0, 10);
}

export function computeScore(property) {
  const inputs = property?.scoreInputs || {};

  // 0–10 sliders
  const commute = to10(inputs.commute); // 10 = best commute
  const priceValue = to10(inputs.priceValue); // 10 = best value for $$
  const layout = to10(inputs.layout); // layout flow / livability
  const light = to10(inputs.light); // natural light
  const neighborhood = to10(inputs.neighborhood); // vibe / location
  const noise = to10(inputs.noise); // 10 = quiet
  const condition = to10(inputs.condition); // overall condition

  // toggles
  const dealBreaker = !!inputs.dealBreaker; // hard no
  const mustHaveMiss = !!inputs.mustHaveMiss; // missing must-have

  // weights (sum ~ 1.0)
  const W = {
    commute: 0.22,
    priceValue: 0.22,
    neighborhood: 0.16,
    layout: 0.14,
    condition: 0.12,
    light: 0.08,
    noise: 0.06,
  };

  // base 0–10 weighted average
  const base10 =
    commute * W.commute +
    priceValue * W.priceValue +
    neighborhood * W.neighborhood +
    layout * W.layout +
    condition * W.condition +
    light * W.light +
    noise * W.noise;

  // convert to 0–100
  let score = Math.round(base10 * 10);

  // penalties
  if (dealBreaker) score = 0;
  if (mustHaveMiss) score = Math.max(0, score - 25);

  const breakdown = {
    base10: Number(base10.toFixed(2)),
    dealBreaker,
    mustHaveMiss,
    weights: W,
    sliders: { commute, priceValue, neighborhood, layout, condition, light, noise },
  };

  return { score, breakdown };
}