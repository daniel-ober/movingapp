// src/pages/SuperAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./SuperAdmin.css";

import {
  listAllWorkspaces,
  listWorkspaceMembers,
  updateWorkspaceAdminFields,
} from "../services/superAdmin";

function safeStr(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function fmtDate(ts) {
  // Firestore Timestamp or plain number/date
  try {
    if (!ts) return "—";
    const d =
      typeof ts?.toDate === "function"
        ? ts.toDate()
        : ts instanceof Date
        ? ts
        : new Date(ts);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US");
  } catch {
    return "—";
  }
}

export default function SuperAdmin() {
  const nav = useNavigate();
  const { user, isSuperAdmin, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [uiError, setUiError] = useState("");

  const [workspaces, setWorkspaces] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const selected = useMemo(() => {
    return workspaces.find((w) => w.id === selectedId) || null;
  }, [workspaces, selectedId]);

  // Load workspaces
  useEffect(() => {
    let alive = true;

    async function run() {
      if (!isSuperAdmin) return;

      setUiError("");
      setLoading(true);
      try {
        const items = await listAllWorkspaces({ pageSize: 80 });
        if (!alive) return;
        setWorkspaces(items || []);
        // auto-select first
        if (!selectedId && items?.[0]?.id) setSelectedId(items[0].id);
      } catch (e) {
        console.error("[SuperAdmin] listAllWorkspaces failed:", e);
        if (alive) setUiError(e?.message || "Failed to load workspaces.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  // Load members when selection changes
  useEffect(() => {
    let alive = true;

    async function run() {
      if (!selectedId) {
        setMembers([]);
        return;
      }

      setMembersLoading(true);
      setUiError("");
      try {
        const m = await listWorkspaceMembers(selectedId);
        if (!alive) return;
        setMembers(m || []);
      } catch (e) {
        console.error("[SuperAdmin] listWorkspaceMembers failed:", e);
        if (alive) setUiError(e?.message || "Failed to load members.");
        if (alive) setMembers([]);
      } finally {
        if (alive) setMembersLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [selectedId]);

  async function updateSelectedWorkspace(patch) {
    if (!selectedId) return;
    setUiError("");

    try {
      await updateWorkspaceAdminFields(selectedId, patch);

      // update local list
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === selectedId ? { ...w, ...patch } : w))
      );
    } catch (e) {
      console.error("[SuperAdmin] updateWorkspaceAdminFields failed:", e);
      setUiError(e?.message || "Failed to update workspace.");
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="sa-shell">
        <div className="sa-card">
          <div className="sa-title">Not authorized</div>
          <div className="sa-sub">
            You don’t have access to the Super Admin console.
          </div>
          <button className="btn btn-primary" onClick={() => nav("/app")}>
            Go to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sa-shell">
      <div className="sa-topbar">
        <div className="sa-topbar-left">
          <div className="sa-h1">Super Admin</div>
          <div className="sa-h2">
            Signed in as <b>{safeStr(user?.email || "—")}</b>
          </div>
        </div>

        <div className="sa-topbar-actions">
          <button className="btn btn-ghost" onClick={() => nav("/app")}>
            Back to /app
          </button>
          <button className="btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {uiError ? <div className="sa-alert">{uiError}</div> : null}

      <div className="sa-grid">
        {/* LEFT: workspace list */}
        <div className="sa-panel">
          <div className="sa-panel-head">
            <div className="sa-panel-title">Accounts / Workspaces</div>
            <div className="sa-panel-meta">
              {loading ? "Loading…" : `${workspaces.length} total`}
            </div>
          </div>

          {loading ? (
            <div className="sa-empty">Loading workspaces…</div>
          ) : workspaces.length === 0 ? (
            <div className="sa-empty">No workspaces found.</div>
          ) : (
            <div className="sa-list">
              {workspaces.map((w) => {
                const active = w.id === selectedId;
                const plan = safeStr(w.plan || "trial");
                const status = safeStr(w.status || "active");

                return (
                  <button
                    key={w.id}
                    type="button"
                    className={`sa-row ${active ? "is-active" : ""}`}
                    onClick={() => setSelectedId(w.id)}
                  >
                    <div className="sa-row-top">
                      <div className="sa-row-name">{safeStr(w.name || "—")}</div>
                      <div className="sa-row-pill">
                        {plan.toUpperCase()} • {status.toUpperCase()}
                      </div>
                    </div>
                    <div className="sa-row-sub">
                      <span className="sa-mono">ID:</span> {w.id}
                    </div>
                    <div className="sa-row-sub">
                      Created: {fmtDate(w.createdAt)} • Trial ends:{" "}
                      {fmtDate(w.trialEndsAt)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: selected details */}
        <div className="sa-panel">
          <div className="sa-panel-head">
            <div className="sa-panel-title">Workspace Details</div>
            <div className="sa-panel-meta">
              {selected ? safeStr(selected.name || "—") : "—"}
            </div>
          </div>

          {!selected ? (
            <div className="sa-empty">Select a workspace to manage.</div>
          ) : (
            <>
              <div className="sa-detail">
                <div className="sa-kv">
                  <div className="sa-k">Workspace ID</div>
                  <div className="sa-v sa-mono">{selected.id}</div>
                </div>

                <div className="sa-kv">
                  <div className="sa-k">Plan</div>
                  <div className="sa-v">
                    <select
                      className="sa-select"
                      value={safeStr(selected.plan || "trial")}
                      onChange={(e) =>
                        updateSelectedWorkspace({ plan: e.target.value })
                      }
                    >
                      <option value="trial">trial</option>
                      <option value="paid">paid</option>
                    </select>
                  </div>
                </div>

                <div className="sa-kv">
                  <div className="sa-k">Status</div>
                  <div className="sa-v">
                    <select
                      className="sa-select"
                      value={safeStr(selected.status || "active")}
                      onChange={(e) =>
                        updateSelectedWorkspace({ status: e.target.value })
                      }
                    >
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="canceled">canceled</option>
                    </select>
                  </div>
                </div>

                <div className="sa-kv">
                  <div className="sa-k">Trial Ends</div>
                  <div className="sa-v">{fmtDate(selected.trialEndsAt)}</div>
                </div>
              </div>

              <div className="sa-divider" />

              <div className="sa-panel-head sa-panel-head-tight">
                <div className="sa-panel-title">Members</div>
                <div className="sa-panel-meta">
                  {membersLoading ? "Loading…" : `${members.length} total`}
                </div>
              </div>

              {membersLoading ? (
                <div className="sa-empty">Loading members…</div>
              ) : members.length === 0 ? (
                <div className="sa-empty">No members found.</div>
              ) : (
                <div className="sa-table">
                  <div className="sa-thead">
                    <div>Email</div>
                    <div>Role</div>
                    <div>UID</div>
                  </div>
                  {members.map((m) => (
                    <div className="sa-tr" key={m.id}>
                      <div className="sa-td">{safeStr(m.email || "—")}</div>
                      <div className="sa-td">
                        <span className="sa-badge">
                          {safeStr(m.role || "member")}
                        </span>
                      </div>
                      <div className="sa-td sa-mono">{safeStr(m.uid || m.id)}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="sa-note">
                Step 1 is read-only member list + plan/status toggles.
                <br />
                Step 2 will add Firestore Rules.
                <br />
                Step 3 will add Cloud Functions to manage users + create accounts safely.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}