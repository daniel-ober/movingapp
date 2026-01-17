import "./MedalCard.css";
import { MUST_HAVES, PLUSES, CHECKLIST_LABELS } from "../utils/scoreProperty";

function fmtMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) return "$0/mo";
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

function commuteClass(mins) {
  const m = safeInt(mins);
  if (m <= 15) return "commute-good";
  if (m <= 20) return "commute-ok";
  if (m <= 30) return "commute-warn";
  return "commute-bad";
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

  const mgmtName =
    (property?.managementCompanyName || "").trim() ||
    (property?.managementCompany || "").trim();

  const { dealbreaker, mustNo, plusOn } = getChecklistHighlights(property);

  const MAX_CHIPS = 3;
  const noChips = mustNo.slice(0, MAX_CHIPS);
  const plusChips = plusOn.slice(0, MAX_CHIPS);

  const extraCount =
    Math.max(0, mustNo.length - noChips.length) +
    Math.max(0, plusOn.length - plusChips.length);

  const medalEmoji = medal === "gold" ? "🥇" : medal === "silver" ? "🥈" : "🥉";

  return (
    <div className={`mc-card mc-${medal} ${isWinner ? "is-winner" : ""}`}>
      <div className="mc-top">
        <div className="mc-titleRow">
          <span className="mc-medalIcon" aria-hidden="true">
            {medalEmoji}
          </span>
          <span className="mc-title">{title}</span>
        </div>

        <div className="mc-score">
          <div className="mc-scoreVal">{score}</div>
          <div className="mc-scoreLab">Score</div>
        </div>
      </div>

      <div className="mc-address">{property?.address || "—"}</div>

      {/* ✅ NEW: management company */}
      {mgmtName ? (
        <div className="mc-mgmt" title="Property Management Company">
          <span className="mc-mgmtLabel">Mgmt:</span>{" "}
          <span className="mc-mgmtName">{mgmtName}</span>
        </div>
      ) : null}

      <div className="mc-meta">
        {fmtMoney(property?.rentMonthly)} • {beds} bd / {baths} ba •{" "}
        {safeInt(sqft).toLocaleString()} sqft
      </div>

      <div className="mc-meta2">
        Chelsea commute:{" "}
        <b className={commuteClass(commute)}>{safeInt(commute)} min</b>
      </div>

      {property?.originalLink ? (
        <div className="mc-link">
          <a
            href={property.originalLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Listing ↗
          </a>
        </div>
      ) : null}

      {(dealbreaker || mustNo.length || plusOn.length) && (
        <div className="mc-chips">
          {dealbreaker && (
            <span className="mc-chip mc-chip-deal">Dealbreaker</span>
          )}

          {noChips.map((k) => (
            <span key={`no-${k}`} className="mc-chip mc-chip-no">
              {labelForKey(k)}
            </span>
          ))}

          {plusChips.map((k) => (
            <span key={`plus-${k}`} className="mc-chip mc-chip-plus">
              {labelForKey(k)}
            </span>
          ))}

          {extraCount > 0 && (
            <span className="mc-chip mc-chip-more">+{extraCount} more</span>
          )}
        </div>
      )}
    </div>
  );
}