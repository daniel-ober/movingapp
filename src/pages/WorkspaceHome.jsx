// src/pages/WorkspaceHome.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAuth } from "../context/AuthContext";
import { TopBar } from "../components/TopBar";

import { AddPropertyModal } from "../components/AddPropertyModal";
import { PropertyDetailModal } from "../components/PropertyDetailModal";

import {
  subscribeToProperties,
  createProperty,
  updateProperty,
} from "../services/properties";

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtUsd(n) {
  const x = Number(n || 0);
  if (!Number.isFinite(x) || x <= 0) return "—";
  return x.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function fmtSqft(n) {
  const num = safeNum(n);
  if (!num) return "—";
  return `${num.toLocaleString()} sqft`;
}

function listingTypeLabel(t) {
  const s = String(t || "rent");
  if (s === "buy") return "For Sale";
  if (s === "rent") return "For Rent";
  return "Listing";
}

function listingTypePillStyle(t) {
  const base = {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.2,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
    whiteSpace: "nowrap",
  };

  const s = String(t || "rent");
  if (s === "buy") {
    return {
      ...base,
      background: "rgba(255, 200, 80, 0.12)",
      border: "1px solid rgba(255, 200, 80, 0.25)",
    };
  }

  return {
    ...base,
    background: "rgba(120, 160, 255, 0.12)",
    border: "1px solid rgba(120, 160, 255, 0.25)",
  };
}

function badgeStyle(kind) {
  const base = {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.2,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
    whiteSpace: "nowrap",
  };

  if (kind === "not_interested") {
    return {
      ...base,
      background: "rgba(255, 80, 80, 0.12)",
      border: "1px solid rgba(255, 80, 80, 0.25)",
    };
  }

  if (kind === "visited") {
    return {
      ...base,
      background: "rgba(90, 200, 120, 0.12)",
      border: "1px solid rgba(90, 200, 120, 0.25)",
    };
  }

  if (kind === "not_visited") {
    return {
      ...base,
      background: "rgba(255, 200, 80, 0.10)",
      border: "1px solid rgba(255, 200, 80, 0.22)",
    };
  }

  return {
    ...base,
    background: "rgba(120, 160, 255, 0.12)",
    border: "1px solid rgba(120, 160, 255, 0.25)",
  };
}

export default function WorkspaceHome() {
  const nav = useNavigate();
  const { logout, user } = useAuth();

  const {
    activeWorkspace,
    activeWorkspaceId,
    role,
    selectWorkspace,
    loadingWorkspaces,
  } = useWorkspace();

  const [properties, setProperties] = useState([]);
  const [propsLoading, setPropsLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeProperty, setActiveProperty] = useState(null);

  const [uiError, setUiError] = useState("");

  useEffect(() => {
    if (loadingWorkspaces) return;
    if (!activeWorkspaceId) nav("/select-workspace", { replace: true });
  }, [activeWorkspaceId, loadingWorkspaces, nav]);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    setUiError("");
    setPropsLoading(true);

    const unsub = subscribeToProperties(activeWorkspaceId, (items) => {
      setProperties(items || []);
      setPropsLoading(false);
    });

    return () => {
      try {
        unsub?.();
      } catch {
        // noop
      }
    };
  }, [activeWorkspaceId]);

  const summary = useMemo(() => {
    const total = properties.length;
    const interested = properties.filter((p) => p.status !== "not_interested");
    const notInterested = total - interested.length;
    const visited = properties.filter((p) => p.visitStatus === "visited").length;
    const notVisited = total - visited;

    return {
      total,
      notInterested,
      visited,
      notVisited,
      active: interested.length,
    };
  }, [properties]);

  async function handleCreate(payload) {
    setUiError("");
    try {
      await createProperty(activeWorkspaceId, payload, user?.uid || "");
    } catch (err) {
      console.error("[WorkspaceHome] createProperty failed:", err);
      setUiError(err?.message || "Failed to create property.");
      throw err;
    }
  }

  async function handleSave(id, patch) {
    setUiError("");
    try {
      await updateProperty(id, patch, activeWorkspaceId, user?.uid || "");
    } catch (err) {
      console.error("[WorkspaceHome] updateProperty failed:", err);
      setUiError(err?.message || "Failed to save changes.");
      throw err;
    }
  }

  function openDetail(p) {
    setActiveProperty(p);
    setDetailOpen(true);
  }

  return (
    <div className="app-shell">
      <TopBar />

      <div style={{ maxWidth: 1180, margin: "18px auto 0" }}>
        <div
          style={{
            padding: 16,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>
              {activeWorkspace?.name ||
                (loadingWorkspaces ? "Loading…" : "Workspace")}
            </div>
            <div style={{ opacity: 0.85, fontSize: 13 }}>
              Role: <b>{role || "—"}</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAddOpen(true)}
              disabled={!activeWorkspaceId}
            >
              + Add Property
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => nav("/select-workspace")}
            >
              Switch Workspace
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => {
                selectWorkspace("");
                nav("/select-workspace");
              }}
            >
              Clear Workspace
            </button>

            <button type="button" className="btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {uiError ? (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255, 60, 60, 0.12)",
              color: "rgba(255,255,255,0.92)",
              fontSize: 14,
            }}
          >
            {uiError}
          </div>
        ) : null}

        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={badgeStyle("interested")}>Active: {summary.active}</div>
          <div style={badgeStyle("not_visited")}>
            Not visited: {summary.notVisited}
          </div>
          <div style={badgeStyle("visited")}>Visited: {summary.visited}</div>
          <div style={badgeStyle("not_interested")}>
            Not interested: {summary.notInterested}
          </div>
          <div style={{ opacity: 0.75, fontSize: 13, marginLeft: 2 }}>
            Workspace-scoped list (live Firestore)
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          {propsLoading ? (
            <div style={{ opacity: 0.85 }}>Loading properties…</div>
          ) : properties.length === 0 ? (
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                No properties yet
              </div>
              <div style={{ opacity: 0.85, marginTop: 6 }}>
                Click <b>+ Add Property</b> to start tracking places.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {properties.map((p) => {
                const status = p.status || "interested";
                const visit = p.visitStatus || "not_visited";

                const listingType = String(p.listingType || "rent");
                const hoa = safeNum(p.hoaMonthly);
                const rent = safeNum(p.rentMonthly);
                const price = safeNum(p.purchasePrice);

                const moneyLine =
                  listingType === "buy"
                    ? (price ? fmtUsd(price) : "—")
                    : (rent ? `${fmtUsd(rent)}/mo` : "—/mo");

                const hoaLine = hoa ? ` • HOA: ${fmtUsd(hoa)}/mo` : "";

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openDetail(p)}
                    className="btn"
                    style={{
                      textAlign: "left",
                      padding: 0,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.05)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ padding: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 900,
                              fontSize: 15,
                              marginBottom: 6,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={p.address || ""}
                          >
                            {p.address || "—"}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              flexWrap: "wrap",
                              opacity: 0.9,
                              fontSize: 13,
                            }}
                          >
                            <span>{moneyLine}{hoaLine}</span>
                            <span>•</span>
                            <span>
                              {(p.beds || "—")} bd / {(p.baths || "—")} ba
                            </span>
                            <span>•</span>
                            <span>{fmtSqft(p.sqft)}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <div style={listingTypePillStyle(listingType)}>
                            {listingTypeLabel(listingType)}
                          </div>
                          <div style={badgeStyle(status)}>
                            {status === "not_interested" ? "Not interested" : "Interested"}
                          </div>
                          <div style={badgeStyle(visit)}>
                            {visit === "visited" ? "Visited" : "Not visited"}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div style={{ opacity: 0.75, fontSize: 13 }}>
                          {p.commuteMinutes
                            ? `Commute: ${p.commuteMinutes} min`
                            : "Click to edit + score"}
                        </div>

                        <div style={{ opacity: 0.9, fontSize: 13, fontWeight: 800 }}>
                          Score: {Number(p.score || 0)}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddPropertyModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={handleCreate}
        companies={[]}
      />

      <PropertyDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        property={activeProperty}
        companies={[]}
        onSave={handleSave}
      />
    </div>
  );
}