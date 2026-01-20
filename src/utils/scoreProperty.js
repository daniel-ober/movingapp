// src/utils/scoreProperty.js

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function parseDateYYYYMMDD(s) {
  if (!s || typeof s !== "string") return null;
  // expects YYYY-MM-DD (from <input type="date" />)
  const d = new Date(s + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysUntil(d) {
  if (!d) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonthmdgetMonth(), d.getDate());
  const diffMs = target.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function isMoveInDisqualified(earliestMoveIn) {
  // Disqualifier: move-in date is 4/1 or later (of the move-in year)
  // If no date is provided, we do NOT disqualify here (still score normally).
  const d = parseDateYYYYMMDD(earliestMoveIn);
  if (!d) return false;

  const cutoff = new Date(d.getFullYear(), 3, 1); // Apr 1 (month is 0-indexed)
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  return target.getTime() >= cutoff.getTime();
}

// Your “bread and butter” checklist lists (fixed keys)
export const MUST_HAVES = [
  "dishwasher",
  "laundry_hookups", // Laundry area + hookups (machines optional)
  "large_kitchen",
  "dining_area",
  "living_room",
  "bedrooms_3_plus",
  "bonus_spaces_2_plus",
  "bathrooms_2_plus",
  "backyard_medium_large",
  "att_service",
  "verizon_service",
  "outdoor_storage",
  "tools_wood_cut_space",
  "small_driveway",
  "fridge_freezer",
  "oven_stove",
  "garden_space",
  "patio_grill_space",
];

export const PLUSES = [
  "fenced_yard",
  "garage",
  "fridge_french_or_side_by_side",
  "washer_dryer_included",
  "microwave",
  "seasonal_decor_space",
  "large_sink",
];

export const CHECKLIST_LABELS = {
  bedrooms_3_plus: "3+ bedrooms (master + guest + craft)",
  bonus_spaces_2_plus: "2+ bonus spaces (Chelsea + Dan zones)",
  bathrooms_2_plus: "2+ bathrooms",
  dining_area: "Dining area",
  living_room: "Living room area",
  dishwasher: "Dishwasher",
  laundry_hookups: "Laundry area + hookups (machines optional)",
  large_kitchen: "Large kitchen / counter space",
  backyard_medium_large: "Medium-to-large backyard",
  outdoor_storage: "Space for outdoor/camping items",
  tools_wood_cut_space: "Space for tools + place to cut wood",
  small_driveway: "Driveway",
  fridge_freezer: "Fridge/freezer",
  oven_stove: "Oven/stove",
  garden_space: "Space to garden/grow vegetables",
  patio_grill_space: "Patio space (grill/lounge/table)",
  att_service: "AT&T cell service works",
  verizon_service: "Verizon cell service works",

  fenced_yard: "Fenced-in backyard",
  large_sink: "Large sink",
  garage: "Garage",
  fridge_french_or_side_by_side: "French door or side-by-side fridge",
  washer_dryer_included: "Washer + dryer included (bonus)",
  microwave: "Microwave",
  seasonal_decor_space: "Seasonal decoration space",
};

// Listing types (for UI + scoring)
export const LISTING_TYPES = ["rent", "buy", "unknown"];
export const LISTING_TYPE_LABELS = {
  rent: "For Rent",
  buy: "For Sale",
  unknown: "Listing",
};

// These are intentionally “reasonable defaults”.
// If you want to tune later, only adjust these constants.
const RENT_IDEAL = 2200; // <= this is best
const RENT_MAX = 3200; // >= this is 0 score
const HOA_PENALTY_START = 200; // HOA starts hurting a bit above this
const HOA_PENALTY_MAX = 600; // big HOA hurts more

const BUY_IDEAL = 450000; // <= this is best
const BUY_MAX = 750000; // >= this is 0 score

/**
 * computeOverallScore(property)
 * Returns:
 *  - score (0–100)
 *  - meta: breakdown numbers
 *  - why: short bullet reasoning for the Winner card
 */
export function computeOverallScore(property) {
  const listingTypeRaw = String(property?.listingType || "rent");
  const listingType = LISTING_TYPES.includes(listingTypeRaw)
    ? listingTypeRaw
    : "rent";

  const rent = Number(property?.rentMonthly) || 0;
  const purchasePrice = Number(property?.purchasePrice) || 0;
  const hoaMonthly = Number(property?.hoaMonthly) || 0;

  const commuteMin = Number(property?.commuteMinutes) || 0;
  const sqft = Number(property?.sqft) || 0;
  const beds = Number(property?.beds) || 0;
  const baths = Number(property?.baths) || 0;

  const checklist = property?.checklist || {};
  const must = checklist.mustHaves || {};
  const plus = checklist.pluses || {};
  const dealbreaker = !!checklist.dealbreaker;

  // DISQUALIFIER: move-in date 4/1 or later
  // Only applies to rentals (move-in doesn’t really apply to “buy” unless you want it to)
  if (listingType === "rent" && isMoveInDisqualified(property?.earliestMoveIn)) {
    const d = parseDateYYYYMMDD(property?.earliestMoveIn);
    const pretty = d
      ? d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })
      : "4/1+";

    return {
      score: 0,
      meta: {
        disqualifiedMoveIn: true,
        earliestMoveIn: property?.earliestMoveIn || "",
        listingType,
      },
      why: [`Disqualified: move-in ${pretty} or later.`],
    };
  }

  // If any dealbreaker: hard zero
  if (dealbreaker) {
    return {
      score: 0,
      meta: { dealbreaker: true, listingType },
      why: ["Dealbreaker flagged."],
    };
  }

  // -------- DETAILS SCORE (max ~60) --------
  // Commute (max 20): <=15 = 20, 25 = 14, 35 = 7, 45+ = 0
  const commuteScore = clamp(20 - ((commuteMin - 15) * 20) / 30, 0, 20);

  // Cost (max 18)
  // - For rent: uses rentMonthly, with HOA penalty if HOA is high
  // - For buy: uses purchasePrice
  let costScore = 0;
  let hoaPenalty = 0;

  if (listingType === "buy") {
    // <= BUY_IDEAL = 18, BUY_MAX = 0
    // linear falloff between ideal and max
    const t = BUY_MAX === BUY_IDEAL ? 1 : (purchasePrice - BUY_IDEAL) / (BUY_MAX - BUY_IDEAL);
    costScore = clamp(18 - clamp(t, 0, 1) * 18, 0, 18);
  } else {
    // rent or unknown defaults to rent scoring
    const t = RENT_MAX === RENT_IDEAL ? 1 : (rent - RENT_IDEAL) / (RENT_MAX - RENT_IDEAL);
    costScore = clamp(18 - clamp(t, 0, 1) * 18, 0, 18);

    // HOA penalty (small & gentle)
    // 0 penalty under HOA_PENALTY_START; up to -3 by HOA_PENALTY_MAX
    if (hoaMonthly > HOA_PENALTY_START) {
      const ht =
        HOA_PENALTY_MAX === HOA_PENALTY_START
          ? 1
          : (hoaMonthly - HOA_PENALTY_START) / (HOA_PENALTY_MAX - HOA_PENALTY_START);
      hoaPenalty = clamp(clamp(ht, 0, 1) * 3, 0, 3);
    }
  }

  // Sqft (max 12): >=2200 = 12, 1800 = 8, 1400 = 4, 1100 = 0
  const sqftScore = clamp((sqft - 1100) / 1100, 0, 1) * 12;

  // Beds/Baths (max 10 combined)
  const bedsScore = beds >= 3 ? 5 : beds === 2 ? 3 : beds === 1 ? 1 : 0;
  const bathsScore = baths >= 2 ? 5 : baths >= 1.5 ? 3 : baths >= 1 ? 1 : 0;

  // Move-in date (max 0–5 bonus; only for rent)
  let moveInScore = 0;
  if (listingType === "rent") {
    const d = parseDateYYYYMMDD(property?.earliestMoveIn);
    const du = daysUntil(d);
    if (du != null) {
      if (du <= 14) moveInScore = 5;
      else if (du <= 30) moveInScore = 3;
      else if (du <= 60) moveInScore = 1;
      else moveInScore = 0;
    }
  }

  const detailsScore =
    commuteScore +
    costScore +
    sqftScore +
    bedsScore +
    bathsScore +
    moveInScore -
    hoaPenalty;

  // -------- CHECKLIST SCORE (max 40) --------
  // Must-haves:
  // +2 for each must-have satisfied, -5 for each explicitly missing.
  // Unknown/unchecked = 0 impact until you confirm.
  let mustPoints = 0;
  let mustMissingCount = 0;
  let mustMetCount = 0;

  for (const key of MUST_HAVES) {
    const v = must[key]; // true | false | undefined
    if (v === true) {
      mustPoints += 2;
      mustMetCount += 1;
    } else if (v === false) {
      mustPoints -= 5;
      mustMissingCount += 1;
    }
  }

  // Pluses: +1 each if true (capped at 8)
  let plusPoints = 0;
  for (const key of PLUSES) {
    if (plus[key] === true) plusPoints += 1;
  }
  plusPoints = clamp(plusPoints, 0, 8);

  const checklistScore = clamp(mustPoints + plusPoints, 0, 40);

  // -------- FINAL --------
  const raw = detailsScore + checklistScore;
  const score = clamp(Math.round(raw), 0, 100);

  // Build “why” bullets (top 3)
  const why = [];

  if (commuteMin) why.push(`Commute: ${commuteMin} min`);

  if (listingType === "buy") {
    if (purchasePrice) {
      why.push(
        `Price: ${purchasePrice.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        })}`
      );
    }
  } else {
    if (rent) {
      const base = rent.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });
      why.push(`Rent: ${base}/mo`);
    }
    if (hoaMonthly) why.push(`HOA: $${hoaMonthly.toLocaleString()}/mo`);
  }

  if (sqft) why.push(`Space: ${sqft.toLocaleString()} sqft`);

  if (mustMissingCount > 0) why.push(`⚠ Missing ${mustMissingCount} must-have(s)`);
  else if (mustMetCount >= 6) why.push(`✅ Must-haves confirmed: ${mustMetCount}`);

  const trimmedWhy = why.slice(0, 3);

  return {
    score,
    meta: {
      listingType,
      detailsScore: Number(detailsScore.toFixed(1)),
      checklistScore: Number(checklistScore.toFixed(1)),
      commuteScore: Number(commuteScore.toFixed(1)),
      costScore: Number(costScore.toFixed(1)),
      hoaPenalty: Number(hoaPenalty.toFixed(1)),
      sqftScore: Number(sqftScore.toFixed(1)),
      bedsScore,
      bathsScore,
      moveInScore,
      mustMetCount,
      mustMissingCount,
      plusPoints,
    },
    why: trimmedWhy.length ? trimmedWhy : ["Add checklist + details to rank it."],
  };
}