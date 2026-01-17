import "./PropertyCard.css";

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

export function PropertyCard({
  property,
  onQuickEdit,
  onOpenChecklist,
  onToggleVisited,
}) {
  const beds = property?.beds || 0;
  const baths = property?.baths || 0;
  const sqft = Number(property?.sqft || 0);
  const commute = property?.commuteMinutes || 0;
  const score = Number(property?.score) || 0;

  const mgmtName =
    (property?.managementCompanyName || "").trim() ||
    (property?.managementCompany || "").trim();

  return (
    <div className="pc-card">
      <div className="pc-top">
        <div className="pc-title">{property?.address || "—"}</div>
      </div>

      {/* ✅ NEW: mgmt company */}
      {mgmtName ? (
        <div className="pc-mgmt" title="Property Management Company">
          <span className="pc-mgmtLabel">Mgmt:</span>
          <span className="pc-mgmtName">{mgmtName}</span>
        </div>
      ) : null}

      <div className="pc-meta">
        {fmtMoney(property?.rentMonthly)} • {beds} bd / {baths} ba •{" "}
        {sqft.toLocaleString()} sqft •{" "}
        <span className={`pc-commute ${commuteClass(commute)}`}>
          {safeInt(commute)} min commute
        </span>
      </div>

      {property?.originalLink ? (
        <div className="pc-link">
          <a
            href={property.originalLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Listing ↗
          </a>
        </div>
      ) : null}

      <div className="pc-actions">
        <div className="pc-actions-left">
          <button
            className="btn btn-primary"
            type="button"
            onClick={onOpenChecklist}
          >
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