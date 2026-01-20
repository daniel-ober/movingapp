// src/utils/scoring.js
// Compatibility layer so older imports keep working.

import { computeOverallScore, scoreProperty } from "./scoreProperty";

// ✅ what most UI code wants: just a number (0–100)
export function computeScore(property) {
  return computeOverallScore(property).score;
}

// ✅ if you want the full breakdown + "why" bullets
export { computeOverallScore, scoreProperty };
