// src/components/AddPropertyModal.jsx
import { useMemo, useState } from "react";
import "./AddPropertyModal.css";

const DEFAULTS = {
  status: "interested",
  visitStatus: "not_visited",
  address: "",
  rentMonthly: "",
  beds: "3",
  baths: "2",
  sqft: "",
  earliestMoveIn: "", // YYYY-MM-DD
  commuteMiles: "",
  commuteMinutes: "",
  originalLink: "",
  managementCompanyId: "", // selected existing company id
  managementCompanyName: "", // if adding new
  notes: "",
};

const BED_OPTIONS = ["1", "2", "3", "4", "5"];
const BATH_OPTIONS = ["1", "1.5", "2", "2.5", "3"];

export function AddPropertyModal({
  open,
  onClose,
  onCreate,

  // NEW (optional)
  companies = [], // [{ id, name }]
  onCreateCompany, // async (name) => { id, name } OR void
}) {
  const [form, setForm] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // UI-only state for the "add new company" flow
  const [companyMode, setCompanyMode] = useState("select"); // "select" | "new"
  const [newCompanyName, setNewCompanyName] = useState("");

  const canSave = useMemo(() => {
    return form.address.trim().length >= 6;
  }, [form.address]);

  if (!open) return null;

  const set = (k) => (e) => {
    setError("");
    setForm((p) => ({ ...p, [k]: e.target.value }));
  };

  function resetAndClose() {
    setForm(DEFAULTS);
    setCompanyMode("select");
    setNewCompanyName("");
    setError("");
    onClose();
  }

  function handleOverlayMouseDown() {
    // close overlay click = just close (don’t wipe typed input)
    onClose();
  }

  function handleCompanySelectChange(e) {
    const v = e.target.value;

    if (v === "__add_new__") {
      setCompanyMode("new");
      setError("");
      setForm((p) => ({
        ...p,
        managementCompanyId: "",
        managementCompanyName: "",
      }));
      return;
    }

    setCompanyMode("select");
    setNewCompanyName("");
    setError("");
    setForm((p) => ({
      ...p,
      managementCompanyId: v,
      managementCompanyName: "",
    }));
  }

  async function handleCreateNewCompany() {
    const name = newCompanyName.trim();
    if (!name) return;

    setError("");

    try {
      // If no handler yet, just store the name in-form
      if (typeof onCreateCompany !== "function") {
        setForm((p) => ({
          ...p,
          managementCompanyId: "",
          managementCompanyName: name,
        }));
        setCompanyMode("select");
        setNewCompanyName("");
        return;
      }

      // Otherwise create + select it
      const created = await onCreateCompany(name);
      const createdId = created?.id;

      setForm((p) => ({
        ...p,
        managementCompanyId: createdId || "",
        managementCompanyName: createdId ? "" : name,
      }));

      setCompanyMode("select");
      setNewCompanyName("");
    } catch (err) {
      console.error("[AddPropertyModal] create company failed:", err);
      setError(err?.message || "Failed to add company.");
    }
  }

  async function handleSave() {
    if (!canSave || saving) return;

    setSaving(true);
    setError("");

    try {
      // Normalize company field before save:
      // - If they picked an existing company, keep managementCompanyId.
      // - If they typed a new one but didn't create it yet, keep managementCompanyName.
      const payload = {
        ...form,
        beds: String(form.beds || ""),
        baths: String(form.baths || ""),
        rentMonthly: form.rentMonthly?.trim?.() ?? form.rentMonthly,
        sqft: form.sqft?.trim?.() ?? form.sqft,
        commuteMiles: form.commuteMiles?.trim?.() ?? form.commuteMiles,
        commuteMinutes: form.commuteMinutes?.trim?.() ?? form.commuteMinutes,
        originalLink: form.originalLink?.trim?.() ?? form.originalLink,
      };

      if (typeof onCreate !== "function") {
        throw new Error("onCreate prop is missing (AddPropertyModal).");
      }

      await onCreate(payload);

      // after successful save, reset
      setForm(DEFAULTS);
      setCompanyMode("select");
      setNewCompanyName("");
      onClose();
    } catch (err) {
      console.error("[AddPropertyModal] save failed:", err);
      setError(err?.message || "Save failed. Check console for details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="apm-overlay" onMouseDown={handleOverlayMouseDown}>
      <div className="apm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="apm-head">
          <div>
            <div className="apm-title">Add Property</div>
            <div className="apm-subtitle">
              Quick capture now — scoring + details come after tour.
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>

        {error ? (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255, 60, 60, 0.12)",
              color: "rgba(255,255,255,0.92)",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="apm-grid">
          <label className="apm-field">
            <span>Address *</span>
            <input
              value={form.address}
              onChange={set("address")}
              placeholder="Enter Address"
              autoFocus
            />
          </label>

          <label className="apm-field">
            <span>Monthly Rent</span>
            <input
              value={form.rentMonthly}
              onChange={set("rentMonthly")}
              placeholder="Enter Monthly Rent"
              inputMode="numeric"
            />
          </label>

          <label className="apm-field">
            <span>Beds</span>
            <select value={form.beds} onChange={set("beds")}>
              {BED_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          <label className="apm-field">
            <span>Baths</span>
            <select value={form.baths} onChange={set("baths")}>
              {BATH_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          <label className="apm-field">
            <span>Sqft</span>
            <input
              value={form.sqft}
              onChange={set("sqft")}
              placeholder="Enter Sqft"
              inputMode="numeric"
            />
          </label>

          <label className="apm-field">
            <span>Earliest Move-in</span>
            <input
              type="date"
              value={form.earliestMoveIn}
              onChange={set("earliestMoveIn")}
            />
          </label>

          <label className="apm-field">
            <span>Commute Miles (VUMC)</span>
            <input
              value={form.commuteMiles}
              onChange={set("commuteMiles")}
              placeholder="Enter Commute Miles"
              inputMode="decimal"
            />
          </label>

          <label className="apm-field">
            <span>Commute Minutes (traffic)</span>
            <input
              value={form.commuteMinutes}
              onChange={set("commuteMinutes")}
              placeholder="Enter Commute Minutes"
              inputMode="numeric"
            />
          </label>

          <label className="apm-field">
            <span>Original Web Link</span>
            <input
              value={form.originalLink}
              onChange={set("originalLink")}
              placeholder="Enter Original Web Link"
              inputMode="url"
            />
          </label>

          <label className="apm-field">
            <span>Property Management Company</span>

            {companyMode === "select" ? (
              <select
                value={form.managementCompanyId || ""}
                onChange={handleCompanySelectChange}
              >
                <option value="">— Select —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="__add_new__">+ Add new…</option>
              </select>
            ) : (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Enter Company Name"
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateNewCompany}
                  disabled={!newCompanyName.trim()}
                >
                  Add
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setCompanyMode("select");
                    setNewCompanyName("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </label>

          <label className="apm-field">
            <span>Status</span>
            <select value={form.status} onChange={set("status")}>
              <option value="interested">Interested</option>
              <option value="not_interested">No Longer Interested</option>
            </select>
          </label>

          <label className="apm-field">
            <span>Visit</span>
            <select value={form.visitStatus} onChange={set("visitStatus")}>
              <option value="not_visited">Not Visited</option>
              <option value="visited">Visited</option>
            </select>
          </label>

          <label className="apm-field apm-notes">
            <span>Notes</span>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              placeholder="Quick notes / gut feel / what to verify on tour..."
            />
          </label>
        </div>

        <div className="apm-actions">
          <button className="btn btn-ghost" onClick={resetAndClose} type="button">
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!canSave || saving}
            type="button"
          >
            {saving ? "Saving..." : "Save Property"}
          </button>
        </div>
      </div>
    </div>
  );
}