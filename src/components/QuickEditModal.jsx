// src/components/QuickEditModal.jsx
import { useEffect, useMemo, useState } from "react";
import "./AddPropertyModal.css"; // reuse existing styling

const BED_OPTIONS = ["1", "2", "3", "4", "5"];
const BATH_OPTIONS = ["1", "1.5", "2", "2.5", "3"];

function toStr(v, fallback = "") {
  if (v == null) return fallback;
  return String(v);
}

export function QuickEditModal({
  open,
  onClose,
  property,
  companies = [],
  onCreateCompany,
  onSave, // async (id, patch)
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState(null);

  // UI-only add-new-company flow
  const [companyMode, setCompanyMode] = useState("select");
  const [newCompanyName, setNewCompanyName] = useState("");

  useEffect(() => {
    if (!open || !property) return;

    setErr("");
    setForm({
      status: property.status || "interested",
      visitStatus: property.visitStatus || "not_visited",
      address: property.address || "",
      rentMonthly: toStr(property.rentMonthly ?? ""),
      beds: toStr(property.beds || "3"),
      baths: toStr(property.baths || "2"),
      sqft: toStr(property.sqft ?? ""),
      earliestMoveIn: property.earliestMoveIn || "",
      commuteMiles: toStr(property.commuteMiles ?? ""),
      commuteMinutes: toStr(property.commuteMinutes ?? ""),
      originalLink: property.originalLink || "",
      managementCompanyId: property.managementCompanyId || "",
      managementCompanyName: property.managementCompanyName || "",
      notes: property.notes || "",
    });

    setCompanyMode("select");
    setNewCompanyName("");
  }, [open, property]);

  const canSave = useMemo(() => {
    return (form?.address || "").trim().length >= 6;
  }, [form?.address]);

  if (!open) return null;
  if (!property || !form) return null;

  const set = (k) => (e) => {
    setErr("");
    setForm((p) => ({ ...p, [k]: e.target.value }));
  };

  function handleBackdropClick(e) {
    // ✅ only close if they clicked the backdrop itself
    if (e.target === e.currentTarget) onClose();
  }

  function handleCompanySelectChange(e) {
    const v = e.target.value;

    if (v === "__add_new__") {
      setCompanyMode("new");
      setForm((p) => ({
        ...p,
        managementCompanyId: "",
        managementCompanyName: "",
      }));
      return;
    }

    setCompanyMode("select");
    setNewCompanyName("");
    setForm((p) => ({
      ...p,
      managementCompanyId: v,
      managementCompanyName: "",
    }));
  }

  async function handleCreateNewCompany() {
    const name = newCompanyName.trim();
    if (!name) return;

    setErr("");

    try {
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

      const created = await onCreateCompany(name);
      const createdId = created?.id;

      setForm((p) => ({
        ...p,
        managementCompanyId: createdId || "",
        managementCompanyName: createdId ? "" : name,
      }));

      setCompanyMode("select");
      setNewCompanyName("");
    } catch (e) {
      console.error("[QuickEditModal] create company failed:", e);
      setErr(e?.message || "Could not create company.");
    }
  }

  async function handleSave() {
    if (!canSave || saving) return;
    if (typeof onSave !== "function") {
      setErr("Save handler not wired (onSave missing).");
      return;
    }

    setSaving(true);
    setErr("");

    try {
      const patch = {
        status: form.status,
        visitStatus: form.visitStatus,
        address: form.address.trim(),
        rentMonthly: Number(form.rentMonthly) || 0,
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
      };

      await onSave(property.id, patch);
      onClose();
    } catch (e) {
      console.error("[QuickEditModal] save failed:", e);
      setErr(e?.message || "Save failed. Check Firestore rules / console.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="apm-overlay" onClick={handleBackdropClick}>
      <div className="apm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="apm-head">
          <div>
            <div className="apm-title">Quick Edit</div>
            <div className="apm-subtitle">
              Edit the original property details (this affects scoring).
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="apm-grid">
          {err ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255, 80, 80, 0.35)",
                background: "rgba(255, 80, 80, 0.10)",
                color: "rgba(255,255,255,0.92)",
                fontSize: 12,
              }}
            >
              {err}
            </div>
          ) : null}

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
                  disabled={!newCompanyName.trim() || saving}
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
                  disabled={saving}
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
          <button className="btn btn-ghost" onClick={onClose} type="button" disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!canSave || saving}
            type="button"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}