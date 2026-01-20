// src/pages/SelectWorkspace.jsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAuth } from "../context/AuthContext";

export default function SelectWorkspace() {
  const nav = useNavigate();
  const { logout } = useAuth();

  const {
    workspaces,
    activeWorkspaceId,
    selectWorkspace,
    loadingWorkspaces,
    refreshWorkspaces,
  } = useWorkspace();

  const hasWorkspaces = useMemo(() => workspaces.length > 0, [workspaces]);

  if (loadingWorkspaces) {
    return (
      <div className="app-shell">
        <div className="app-main">
          <h2>Loading workspaces…</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-main">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Select Workspace</h2>
            <div style={{ opacity: 0.75, marginTop: 6, fontSize: 13 }}>
              Choose where you’re tracking properties.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => nav("/create-workspace")}
            >
              + Create Workspace
            </button>

            <button type="button" className="btn btn-ghost" onClick={() => nav("/join")}>
              Join with Code
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => refreshWorkspaces?.()}
            >
              Refresh
            </button>

            <button type="button" className="btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {hasWorkspaces ? (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {workspaces.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  selectWorkspace(w.id);
                  nav("/app");
                }}
                style={{
                  textAlign: "left",
                  padding: 14,
                  borderRadius: 14,
                  border:
                    w.id === activeWorkspaceId
                      ? "2px solid rgba(106,168,255,0.40)"
                      : "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 900 }}>{w.name || "Workspace"}</div>
                <div style={{ opacity: 0.75, fontSize: 13, marginTop: 4 }}>
                  Plan: {w.plan || "free"} • Owner:{" "}
                  {w.ownerEmail || w.ownerUid?.slice?.(0, 8) || "—"}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ marginTop: 14 }}>
            No workspaces found for this account. Create one, or join with a code.
          </div>
        )}
      </div>
    </div>
  );
}