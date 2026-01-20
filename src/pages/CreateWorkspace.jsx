// src/pages/CreateWorkspace.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";

import { createWorkspace } from "../services/workspaces";

export default function CreateWorkspace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const wsCtx = useWorkspace();

  const setActiveWorkspaceId =
    wsCtx.setActiveWorkspaceId ||
    wsCtx.setActiveWorkspace ||
    wsCtx.selectWorkspace ||
    null;

  const refresh =
    wsCtx.getMyWorkspaces ||
    wsCtx.refreshWorkspaces ||
    wsCtx.loadMyWorkspaces ||
    null;

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  const canSubmit = useMemo(() => name.trim().length >= 2 && !creating, [name, creating]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setCreating(true);

    try {
      // We try an object payload first (most common),
      // then fallback to a simple "name" signature.
      let result;
      try {
        result = await createWorkspace({
          name: name.trim(),
          ownerUid: user?.uid || "",
          ownerEmail: user?.email || "",
        });
      } catch (err) {
        // fallback signature
        result = await createWorkspace(name.trim());
      }

      // Normalize expected outputs
      const workspaceId =
        result?.workspaceId || result?.id || result?.docId || result || null;

      setCreated(result || { workspaceId });

      if (workspaceId) {
        if (typeof setActiveWorkspaceId === "function") {
          await setActiveWorkspaceId(workspaceId);
        } else {
          localStorage.setItem("activeWorkspaceId", workspaceId);
        }
      }

      if (typeof refresh === "function") {
        try {
          await refresh();
        } catch {
          // no-op
        }
      }

      navigate("/app");
    } catch (e2) {
      console.error(e2);
      setError(e2?.message || "Could not create workspace.");
    } finally {
      setCreating(false);
    }
  }

  // ---------- Styles ----------
  const styles = {
    shell: {
      minHeight: "100vh",
      padding: "clamp(14px, 2.4vw, 28px)",
      background:
        "radial-gradient(1200px 600px at 20% -10%, rgba(106, 168, 255, 0.18), transparent 60%)," +
        "radial-gradient(1000px 600px at 85% 0%, rgba(139, 92, 246, 0.16), transparent 55%)," +
        "var(--bg)",
      color: "var(--text)",
    },
    main: {
      maxWidth: "860px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
    },
    topRow: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
    },
    h1: { margin: 0, fontSize: "34px", letterSpacing: "-0.6px", lineHeight: 1.12 },
    sub: { margin: "6px 0 0 0", color: "var(--muted)", fontSize: "14px" },
    panel: {
      border: "1px solid var(--border)",
      background: "rgba(255,255,255,0.03)",
      boxShadow: "var(--shadow)",
      borderRadius: "18px",
      padding: "14px",
    },
    label: { display: "block", fontSize: "13px", color: "var(--muted)", marginBottom: "8px" },
    input: {
      width: "100%",
      height: "44px",
      borderRadius: "14px",
      border: "1px solid var(--border)",
      background: "rgba(255,255,255,0.04)",
      color: "var(--text)",
      padding: "0 12px",
      fontSize: "16px",
      outline: "none",
    },
    row: { display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" },
    error: {
      border: "1px solid rgba(239, 68, 68, 0.35)",
      background: "rgba(239, 68, 68, 0.08)",
      color: "rgba(255,255,255,0.92)",
      padding: "10px 12px",
      borderRadius: "14px",
      fontSize: "13px",
      marginTop: "10px",
    },
    mini: { marginTop: "10px", color: "var(--muted2)", fontSize: "12px", lineHeight: 1.45 },
    pill: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 10px",
      borderRadius: "999px",
      border: "1px solid var(--border)",
      background: "rgba(255,255,255,0.03)",
      color: "var(--muted)",
      fontSize: "12px",
    },
  };

  return (
    <div style={styles.shell}>
      <div style={styles.main}>
        <div style={styles.topRow}>
          <div>
            <h1 style={styles.h1}>Create Workspace</h1>
            <p style={styles.sub}>
              Workspaces keep Chelsea + Dan’s properties, checklists, and scoring organized.
            </p>
          </div>

          <button className="btn" onClick={() => navigate("/select-workspace")} type="button">
            ← Back
          </button>
        </div>

        <div style={styles.panel}>
          <form onSubmit={handleCreate}>
            <div style={styles.label}>Workspace name</div>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dan & Chelsea"
              autoFocus
            />

            <div style={styles.row}>
              <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
                {creating ? "Creating…" : "Create Workspace"}
              </button>

              <span style={styles.pill}>
                Role: <strong style={{ color: "var(--text)" }}>owner</strong>
              </span>
            </div>

            {error ? <div style={styles.error}>{error}</div> : null}

            <div style={styles.mini}>
              This will create:
              <ul style={{ margin: "8px 0 0 18px", color: "var(--muted)" }}>
                <li>A workspace record</li>
                <li>Your membership as <strong>owner</strong></li>
                <li>(Optional) a join code if your backend/service supports it</li>
              </ul>

              {created?.joinCode ? (
                <div style={{ marginTop: "10px" }}>
                  Join code:{" "}
                  <strong style={{ color: "var(--text)" }}>{created.joinCode}</strong>
                </div>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}