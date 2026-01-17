import { useEffect, useMemo, useState } from "react";
import "./ChecklistModal.css";
import { MUST_HAVES, PLUSES, CHECKLIST_LABELS } from "../utils/scoreProperty";

/**
 * Firestore does NOT allow `undefined` values anywhere (even deep fields).
 * This helper removes undefined values recursively before saving.
 */
function pruneUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(pruneUndefined).filter((v) => v !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([k, v]) => [k, pruneUndefined(v)])
        .filter(([, v]) => v !== undefined)
    );
  }

  return value === undefined ? undefined : value;
}

function initBoolMap(keys, existing = {}) {
  const out = {};
  for (const k of keys) out[k] = existing[k]; // true | false | undefined
  return out;
}

export function ChecklistModal({ open, onClose, property, onSave }) {
  const [saving, setSaving] = useState(false);

  const [mustHaves, setMustHaves] = useState({});
  const [pluses, setPluses] = useState({});
  const [dealbreaker, setDealbreaker] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !property) return;

    const existing = property.checklist || {};
    setMustHaves(initBoolMap(MUST_HAVES, existing.mustHaves || {}));
    setPluses(initBoolMap(PLUSES, existing.pluses || {}));
    setDealbreaker(!!existing.dealbreaker);
    setNotes(existing.notes || "");
  }, [open, property]);

  const canSave = useMemo(() => {
    return !!property?.id;
  }, [property?.id]);

  if (!open) return null;
  if (!property) return null;

  function cycleMustHave(key) {
    // tri-state: undefined -> true -> false -> undefined
    setMustHaves((p) => {
      const cur = p[key];
      const next = cur === undefined ? true : cur === true ? false : undefined;
      return { ...p, [key]: next };
    });
  }

  function togglePlus(key) {
    // pluses are binary: undefined(off) <-> true(on)
    setPluses((p) => ({ ...p, [key]: p[key] === true ? undefined : true }));
  }

  async function handleSave() {
    if (!canSave || saving) return;
    if (typeof onSave !== "function") return;

    setSaving(true);
    try {
      const rawChecklist = {
        mustHaves,
        pluses,
        dealbreaker,
        notes: notes.trim(),
        updatedAtLocal: Date.now(),
      };

      const cleanedChecklist = pruneUndefined(rawChecklist);

      await onSave(property.id, cleanedChecklist);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function handleOverlayMouseDown() {
    // Overlay click closes modal (don’t wipe state here, just close)
    onClose();
  }

  return (
    <div className="cm-overlay" onMouseDown={handleOverlayMouseDown}>
      <div className="cm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cm-head">
          <div>
            <div className="cm-title">Checklist</div>
            <div className="cm-subtitle">{property.address || "—"}</div>
          </div>

          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {/* ✅ Scrollable body */}
        <div className="cm-body">
          <div className="cm-grid">
            <div className="cm-col">
              <div className="cm-sectionTitle">Must-haves (weighted heavy)</div>
              <div className="cm-hint">
                Tap to cycle: Unknown → Yes → No → Unknown
              </div>

              <div className="cm-list">
                {MUST_HAVES.map((k) => {
                  const v = mustHaves[k];
                  const state = v === true ? "yes" : v === false ? "no" : "unk";

                  return (
                    <button
                      key={k}
                      type="button"
                      className={`cm-item cm-${state}`}
                      onClick={() => cycleMustHave(k)}
                    >
                      <span className="cm-dot" />
                      <span className="cm-label">{CHECKLIST_LABELS[k] || k}</span>
                      <span className="cm-state">
                        {v === true ? "Yes" : v === false ? "No" : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="cm-col">
              <div className="cm-sectionTitle">Pluses (nice-to-have)</div>
              <div className="cm-hint">Tap to toggle: Off / On</div>

              <div className="cm-list">
                {PLUSES.map((k) => {
                  const on = pluses[k] === true;
                  return (
                    <button
                      key={k}
                      type="button"
                      className={`cm-item cm-plus ${on ? "is-on" : ""}`}
                      onClick={() => togglePlus(k)}
                    >
                      <span className="cm-dot" />
                      <span className="cm-label">{CHECKLIST_LABELS[k] || k}</span>
                      <span className="cm-state">{on ? "On" : "—"}</span>
                    </button>
                  );
                })}
              </div>

              <label className="cm-deal">
                <input
                  type="checkbox"
                  checked={dealbreaker}
                  onChange={(e) => setDealbreaker(e.target.checked)}
                />
                <span>Dealbreaker (score becomes 0)</span>
              </label>

              <label className="cm-notes">
                <span>Checklist Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Dealbreakers, trade-offs, gut feel, tour notes..."
                />
              </label>
            </div>
          </div>
        </div>

        {/* ✅ Sticky footer actions */}
        <div className="cm-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? "Saving..." : "Save Checklist"}
          </button>
        </div>
      </div>
    </div>
  );
}