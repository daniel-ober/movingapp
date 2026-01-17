// src/components/PropertyCard.jsx
import "./PropertyCard.css";

function fmtMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) return "$0/mo";
  return x.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }) + "/mo";
}

export function PropertyCard({
  property,
  onQuickEdit,
  onOpenChecklist,
}) {
  const beds = property.beds || 0;
  const baths = property.baths || 0;
  const sqft = property.sqft || 0;
  const commute = property.commuteMinutes || 0;

  return (
    <div className="pc-card">
      <div className="pc-title">{property.address || "—"}</div>

      <div className="pc-meta">
        {fmtMoney(property.rentMonthly)} • {beds} bd / {baths} ba •{" "}
        {sqft.toLocaleString()} sqft • {commute} min commute
      </div>

      <div className="pc-actions">
        <div className="pc-actions-left">
          <button
            className="btn btn-primary"
            type="button"
            onClick={onOpenChecklist}
          >
            Checklist
          </button>

          <button
            className="btn btn-ghost"
            type="button"
            onClick={onQuickEdit}
          >
            Edit Property
          </button>
        </div>

        <div className="pc-score-badge">
          {Number(property.score) || 0}
        </div>
      </div>
    </div>
  );
}