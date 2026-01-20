// src/components/PropertyCard.jsx
import "./PropertyCard.css";

function safeInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeNum(v) {
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

function fmtUsd(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) return "$0";
  return x.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function listingTypeLabel(t) {
  const s = String(t || "rent");
  if (s === "buy") return "For Sale";
  if (s === "rent") return "For Rent";
  return "Listing";
}

function listingTypeClass(t) {
  const s = String(t || "rent");
  if (s === "buy") return "pc-pill-buy";
  if (s === "rent") return "pc-pill-rent";
  return "pc-pill-unknown";
}

export function PropertyCard({
  property,
  onQuickEdit,
  onOpenChecklist,
  onToggleVisited,
}) {
  const beds = property?.beds || 0;
  const baths = property?.baths || 0;
  const sqft = safeNum(property?.sqft || 0);
  const commute = safeInt(property?.commuteMinutes || 0);
  const score = safeInt(property?.score) || 0;

  const listingType = property?.listingType || "rent";
  const rentMonthly = safeNum(property?.rentMonthly || 0);
  const purchasePrice = safeNum(property?.purchasePrice || 0);
  const hoaMonthly = safeNum(property?.hoaMonthly || 0);

  const mgmtName =
    (property?.managementCompanyName || "").trim() ||
    (property?.managementCompany || "").trim();

  // Money line depends on listing type
  let moneyLine = "";
  if (String(listingType) === "buy") {
    moneyLine = purchasePrice ? fmtUsd(purchasePrice) : "—";
  } else {
    // rent / unknown
    moneyLine = rentMonthly ? `${fmtUsd(rentMonthly)}/mo` : "—/mo";
  }

  // Optional HOA display (useful for both, but especially rent)
  const hoaLine =
    hoaMonthly && hoaMonthly > 0 ? ` • HOA: ${fmtUsd(hoaMonthly)}/mo` : "";

  return (
    <div className="pc-card">
      <div className="pc-top">
        <div className="pc-title">{property?.address || "—"}</div>

        {/* Listing type pill */}
        <div className={`pc-pill ${listingTypeClass(listingType)}`}>
          {listingTypeLabel(listingType)}
        </div>
      </div>

      {/* ✅ mgmt company */}
      {mgmtName ? (
        <div className="pc-mgmt" title="Property Management Company">
          <span className="pc-mgmtLabel">Mgmt:</span>
          <span className="pc-mgmtName">{mgmtName}</span>
        </div>
      ) : null}

      <div className="pc-meta">
        {moneyLine}
        {hoaLine} • {beds} bd / {baths} ba • {sqft.toLocaleString()} sqft •{" "}
        <span className={`pc-commute ${commuteClass(commute)}`}>
          {safeInt(commute)} min commute
        </span>
      </div>

      {property?.originalLink ? (
        <div className="pc-link">
          <a href={property.originalLink} target="_blank" rel="noopener noreferrer">
            View Listing ↗
          </a>
        </div>
      ) : null}

      <div className="pc-actions">
        <div className="pc-actions-left">
          <button className="btn btn-primary" type="button" onClick={onOpenChecklist}>
            Open Checklist
          </button>

          <button className="btn btn-ghost" type="button" onClick={onQuickEdit}>
            Edit Property Details
          </button>
        </div>

        <div className="pc-score-badge" title="Overall score">
          {score}
        </div>
      </div>
    </div>
  );
}