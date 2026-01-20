// src/components/PropertyDetailModal.jsx
import { useEffect, useMemo, useState } from "react";
import "./PropertyDetailModal.css";
import { computeScore } from "../utils/scoring";

const BED_OPTIONS = ["1", "2", "3", "4", "5"];
const BATH_OPTIONS = ["1", "1.5", "2", "2.5", "3"];

function safeStr(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

const EMPTY_FORM = {
  listingType: "rent", // ✅ NEW
  status: "interested",
  visitStatus: "not_visited",
  address: "",
  rentMonthly: "",
  purchasePrice: "", // ✅ NEW
  hoaMonthly: "", // ✅ NEW
  beds: "3",
  baths: "2",
  sqft: "",
  earliestMoveIn: "",
  commuteMiles: "",
  commuteMinutes: "",
  originalLink: "",
  managementCompanyId: "",
  managementCompanyName: "",
  notes: "",
  scoreInputs: {
    commute: 5,
    priceValue: 5,
    neighborhood: 5,
    layout: 5,
    condition: 5,
    light: 5,
    noise: 5,
    dealBreaker: false,
    mustHaveMiss: false,
    scoringNotes: "",
  },
};

export function PropertyDetailModal({
  open,
  onClose,
  property,
  companies = [],
  onSave,
}) {
  const [tab, setTab] = useState("details");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;

    setTab("details");

    if (!property) {
      setForm(EMPTY_FORM);
      return;
    }

    setForm({
      listingType: safeStr(property.listingType || "rent"),
      status: property.status || "interested",
      visitStatus: property.visitStatus || "not_visited",
      address: safeStr(property.address),
      rentMonthly: safeStr(property.rentMonthly ?? ""),
      purchasePrice: safeStr(property.purchasePrice ?? ""),
      hoaMonthly: safeStr(property.hoaMonthly ?? ""),
      beds: safeStr(property.beds || "3"),
      baths: safeStr(property.baths || "2"),
      sqft: safeStr(property.sqft ?? ""),
      earliestMoveIn: safeStr(property.earliestMoveIn || ""),
      commuteMiles: safeStr(property.commuteMiles ?? ""),
      commuteMinutes: safeStr(property.commuteMinutes ?? ""),
      originalLink: safeStr(property.originalLink || ""),
      managementCompanyId: safeStr(property.managementCompanyId || ""),
      managementCompanyName: safeStr(property.managementCompanyName || ""),
      notes: safeStr(property.notes || ""),

      scoreInputs: {
        commute: property?.scoreInputs?.commute ?? 5,
        priceValue: property?.scoreInputs?.priceValue ?? 5,
        neighborhood: property?.scoreInputs?.neighborhood ?? 5,
        layout: property?.scoreInputs?.layout ?? 5,
        condition: property?.scoreInputs?.condition ?? 5,
        light: property?.scoreInputs?.light ?? 5,
        noise: property?.scoreInputs?.noise ?? 5,
        dealBreaker: !!property?.scoreInputs?.dealBreaker,
        mustHaveMiss: !!property?.scoreInputs?.mustHaveMiss,
        scoringNotes: safeStr(property?.scoreInputs?.scoringNotes || ""),
      },
    });
  }, [open, property]);

  const canSave = useMemo(() => {
    return (form?.address || "").trim().length >= 6;
  }, [form]);

  const computed = useMemo(() => {
    try {
      return computeScore({ ...(property || {}), ...(form || EMPTY_FORM) });
    } catch (e) {
      console.error("[PropertyDetailModal] computeScore failed:", e);
      return { score: 0, breakdown: { error: "computeScore failed" } };
    }
  }, [property, form]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const setScore = (k) => (e) =>
    setForm((p) => ({
      ...p,
      scoreInputs: {
        ...p.scoreInputs,
        [k]:
          e.target.type === "checkbox"
            ? e.target.checked
            : Number(e.target.value),
      },
    }));

  async function handleSave() {
    if (!open) return;
    if (!property?.id) return;
    if (!canSave || saving) return;
    if (typeof onSave !== "function") return;

    setSaving(true);
    try {
      const listingType = String(form.listingType || "rent");

      const patch = {
        listingType,

        status: form.status,
        visitStatus: form.visitStatus,
        address: form.address.trim(),

        rentMonthly: listingType === "rent" ? Number(form.rentMonthly) || 0 : Number(property?.rentMonthly) || 0,
        purchasePrice: listingType === "buy" ? Number(form.purchasePrice) || 0 : Number(property?.purchasePrice) || 0,

        hoaMonthly: Number(form.hoaMonthly) || 0,

        beds: String(form.beds || ""),
        baths: String(form.baths || ""),
        sqft: Number(form.sqft) || 0,
        earliestMoveIn: form.earliestMoveIn || "",
        commuteMiles: Number(form.commuteMiles) || 0,
        commuteMinutes: Number(form.commuteMinutes) || 0,
        originalLink: (form.originalLink || "").trim(),
        managementCompanyId: form.managementCompanyId || "",
        managementCompanyName: (form.managementCompanyName || "").trim(),
        notes: (form.notes || "").trim(),

        scoreInputs: {
          ...form.scoreInputs,
          scoringNotes: (form.scoreInputs.scoringNotes || "").trim(),
        },

        score: computed.score,
        scoreBreakdown: computed.breakdown,
      };

      await onSave(property.id, patch);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const isBuy = String(form.listingType || "rent") === "buy";

  return (
    <div className="pdm-overlay" onMouseDown={onClose}>
      <div className="pdm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="pdm-head">
          <div>
            <div className="pdm-title">Property Details</div>
            <div className="pdm-subtitle">{property?.address || "—"}</div>
          </div>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {!property ? (
          <div style={{ padding: 14, opacity: 0.9 }}>No property selected.</div>
        ) : (
          <>
            <div className="pdm-tabs">
              <button
                className={`pdm-tab ${tab === "details" ? "is-active" : ""}`}
                type="button"
                onClick={() => setTab("details")}
              >
                Details
              </button>
              <button
                className={`pdm-tab ${tab === "score" ? "is-active" : ""}`}
                type="button"
                onClick={() => setTab("score")}
              >
                Score
              </button>

              <div className="pdm-scorechip" title="Computed score (0–100)">
                Score: <strong>{computed.score}</strong>
              </div>
            </div>

            {tab === "details" ? (
              <div className="pdm-grid">
                <label className="pdm-field">
                  <span>Listing Type</span>
                  <select value={form.listingType} onChange={set("listingType")}>
                    <option value="rent">For Rent</option>
                    <option value="buy">For Sale</option>
                  </select>
                </label>

                <label className="pdm-field">
                  <span>Address *</span>
                  <input
                    value={form.address}
                    onChange={set("address")}
                    placeholder="Enter Address"
                  />
                </label>

                {isBuy ? (
                  <label className="pdm-field">
                    <span>Purchase Price</span>
                    <input
                      value={form.purchasePrice}
                      onChange={set("purchasePrice")}
                      placeholder="Enter Purchase Price"
                      inputMode="numeric"
                    />
                  </label>
                ) : (
                  <label className="pdm-field">
                    <span>Monthly Rent</span>
                    <input
                      value={form.rentMonthly}
                      onChange={set("rentMonthly")}
                      placeholder="Enter Monthly Rent"
                      inputMode="numeric"
                    />
                  </label>
                )}

                <label className="pdm-field">
                  <span>HOA (Monthly)</span>
                  <input
                    value={form.hoaMonthly}
                    onChange={set("hoaMonthly")}
                    placeholder="Enter HOA Monthly"
                    inputMode="numeric"
                  />
                </label>

                <label className="pdm-field">
                  <span>Beds</span>
                  <select value={form.beds} onChange={set("beds")}>
                    {BED_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="pdm-field">
                  <span>Baths</span>
                  <select value={form.baths} onChange={set("baths")}>
                    {BATH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="pdm-field">
                  <span>Sqft</span>
                  <input
                    value={form.sqft}
                    onChange={set("sqft")}
                    placeholder="Enter Sqft"
                    inputMode="numeric"
                  />
                </label>

                <label className="pdm-field">
                  <span>Earliest Move-in</span>
                  <input
                    type="date"
                    value={form.earliestMoveIn}
                    onChange={set("earliestMoveIn")}
                  />
                </label>

                <label className="pdm-field">
                  <span>Commute Miles (VUMC)</span>
                  <input
                    value={form.commuteMiles}
                    onChange={set("commuteMiles")}
                    placeholder="Enter Commute Miles"
                    inputMode="decimal"
                  />
                </label>

                <label className="pdm-field">
                  <span>Commute Minutes (traffic)</span>
                  <input
                    value={form.commuteMinutes}
                    onChange={set("commuteMinutes")}
                    placeholder="Enter Commute Minutes"
                    inputMode="numeric"
                  />
                </label>

                <label className="pdm-field">
                  <span>Original Web Link</span>
                  <input
                    value={form.originalLink}
                    onChange={set("originalLink")}
                    placeholder="Enter Original Web Link"
                    inputMode="url"
                  />
                </label>

                <label className="pdm-field">
                  <span>Property Management Company</span>
                  <select
                    value={form.managementCompanyId || ""}
                    onChange={set("managementCompanyId")}
                  >
                    <option value="">— Select —</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="pdm-field">
                  <span>Status</span>
                  <select value={form.status} onChange={set("status")}>
                    <option value="interested">Interested</option>
                    <option value="not_interested">No Longer Interested</option>
                  </select>
                </label>

                <label className="pdm-field">
                  <span>Visit</span>
                  <select value={form.visitStatus} onChange={set("visitStatus")}>
                    <option value="not_visited">Not Visited</option>
                    <option value="visited">Visited</option>
                  </select>
                </label>

                <label className="pdm-field pdm-notes">
                  <span>Notes</span>
                  <textarea
                    value={form.notes}
                    onChange={set("notes")}
                    placeholder="Quick notes / gut feel / what to verify on tour..."
                  />
                </label>
              </div>
            ) : (
              <div className="pdm-score">
                <div className="pdm-scoregrid">
                  <ScoreRow
                    label="Commute"
                    value={form.scoreInputs.commute}
                    onChange={setScore("commute")}
                  />
                  <ScoreRow
                    label="Price / Value"
                    value={form.scoreInputs.priceValue}
                    onChange={setScore("priceValue")}
                  />
                  <ScoreRow
                    label="Neighborhood"
                    value={form.scoreInputs.neighborhood}
                    onChange={setScore("neighborhood")}
                  />
                  <ScoreRow
                    label="Layout"
                    value={form.scoreInputs.layout}
                    onChange={setScore("layout")}
                  />
                  <ScoreRow
                    label="Condition"
                    value={form.scoreInputs.condition}
                    onChange={setScore("condition")}
                  />
                  <ScoreRow
                    label="Natural Light"
                    value={form.scoreInputs.light}
                    onChange={setScore("light")}
                  />
                  <ScoreRow
                    label="Noise"
                    value={form.scoreInputs.noise}
                    onChange={setScore("noise")}
                  />

                  <label className="pdm-check">
                    <input
                      type="checkbox"
                      checked={!!form.scoreInputs.mustHaveMiss}
                      onChange={setScore("mustHaveMiss")}
                    />
                    <span>Missing a must-have (–25)</span>
                  </label>

                  <label className="pdm-check">
                    <input
                      type="checkbox"
                      checked={!!form.scoreInputs.dealBreaker}
                      onChange={setScore("dealBreaker")}
                    />
                    <span>Deal breaker (score becomes 0)</span>
                  </label>
                </div>

                <label className="pdm-field">
                  <span>Scoring Notes</span>
                  <textarea
                    value={form.scoreInputs.scoringNotes}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        scoreInputs: {
                          ...p.scoreInputs,
                          scoringNotes: e.target.value,
                        },
                      }))
                    }
                    placeholder="Why this score? What did you notice on tour?"
                  />
                </label>

                <div className="pdm-breakdown">
                  <div className="pdm-breakdown-title">Breakdown</div>
                  <pre>{JSON.stringify(computed.breakdown, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="pdm-actions">
              <button className="btn btn-ghost" type="button" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleSave}
                disabled={!canSave || saving || !property?.id}
                title={!property?.id ? "No property selected" : undefined}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreRow({ label, value, onChange }) {
  return (
    <div className="pdm-scorerow">
      <div className="pdm-scorerow-label">{label}</div>
      <input
        className="pdm-range"
        type="range"
        min="0"
        max="10"
        step="1"
        value={Number(value) || 0}
        onChange={onChange}
      />
      <div className="pdm-scorerow-val">{Number(value) || 0}/10</div>
    </div>
  );
}