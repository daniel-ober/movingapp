// src/components/MedalCard.jsx
import "./MedalCard.css";
import { MUST_HAVES, PLUSES, CHECKLIST_LABELS } from "../utils/scoreProperty";

function fmtMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) return "$0.00/mo";
  return (
    x.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }) + "/mo"
  );
}

function safeInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getChecklistHighlights(property) {
  const checklist = property?.checklist || {};
  const must = checklist.mustHaves || {};
  const plus = checklist.pluses || {};

  const mustNo = MUST_HAVES.filter((k) => must[k] === false);
  const plusOn = PLUSES.filter((k) => plus[k] === true);

  return {
    dealbreaker: !!checklist.dealbreaker,
    mustNo,
    plusOn,
  };
}

function labelForKey(k) {
  return CHECKLIST_LABELS?.[k] || k;
}

export function MedalCard({ medal, title, property, isWinner }) {
  const beds = property?.beds ?? 0;
  const baths = property?.baths ?? 0;
  const sqft = property?.sqft ?? 0;
  const commute = property?.commuteMinutes ?? 0;
  const score = safeInt(property?.score);

  const { dealbreaker, mustNo, plusOn } = getChecklistHighlights(property);

  // keep this tight so it doesn’t overwhelm the top cards
  const MAX_CHIPS = 3;
  const noChips = mustNo.slice(0, MAX_CHIPS);
  const plusChips = plusOn.slice(0, MAX_CHIPS);

  const extraCount = Math.max(0, mustNo.length - noChips.length) + Math.max(0, plusOn.length - plusChips.length);

  return (
    <div className={`mc-card mc-${medal} ${isWinner ? "is-winner" : ""}`}>
      <div className="mc-top">
        <div className="mc-left">
          <div className="mc-titleRow">
            <span className="mc-medalIcon" aria-hidden="true">
              {medal === "gold" ? "🥇" : medal === "silver" ? "🥈" : "🥉"}
            </span>
            <span className="mc-title">{title}</span>
          </div>
        </div>

        <div className="mc-score">
          <div className="mc-scoreVal">{score}</div>
          <div className="mc-scoreLab">Score</div>
        </div>
      </div>

      <div className="mc-address">{property?.address || "—"}</div>

      <div className="mc-meta">
        {fmtMoney(property?.rentMonthly)} &nbsp;•&nbsp; {beds} bd / {baths} ba
        &nbsp;•&nbsp; {safeInt(sqft).toLocaleString()} sqft
      </div>

      <div className="mc-meta2">
        Chelsea commute: <b>{safeInt(commute)} min</b>
      </div>

      {/* ✅ NEW: Checklist highlights */}
      {dealbreaker || mustNo.length || plusOn.length ? (
        <div className="mc-chips">
          {dealbreaker ? (
            <span className="mc-chip mc-chip-deal">Dealbreaker</span>
          ) : null}

          {noChips.map((k) => (
            <span key={`no-${k}`} className="mc-chip mc-chip-no" title="Non-negotiable marked NO">
              <span className="mc-chipTag">No:</span> {labelForKey(k)}
            </span>
          ))}

          {plusChips.map((k) => (
            <span key={`plus-${k}`} className="mc-chip mc-chip-plus" title="Nice-to-have marked ON">
              <span className="mc-chipTag">Plus:</span> {labelForKey(k)}
            </span>
          ))}

          {extraCount > 0 ? (
            <span className="mc-chip mc-chip-more" title="More checklist highlights not shown">
              +{extraCount} more
            </span>
          ) : null}
        </div>
      ) : null}

      {property?.why?.length ? (
        <div className="mc-why">
          <div className="mc-whyTitle">Why it’s #{medal === "gold" ? 1 : medal === "silver" ? 2 : 3}</div>
          <ul className="mc-whyList">
            {property.why.slice(0, 3).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}