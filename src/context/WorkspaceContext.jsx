// src/context/WorkspaceContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { getMyMembership, getMyWorkspaces } from "../services/workspaces";

const WorkspaceContext = createContext(null);

const STORAGE_KEY = "movingapp_active_workspace_id";

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);

  // Load saved workspace id once
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "";
  });

  const [membership, setMembership] = useState(null);

  // Distinguish between:
  // - "we haven't checked yet" (true)
  // - "we checked and user has none" (false + empty list)
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [loadingMembership, setLoadingMembership] = useState(false);

  // 🔁 refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);
  function refreshWorkspaces() {
    setRefreshKey((k) => k + 1);
  }

  // Helper to set + persist active workspace id
  function setActiveIdPersist(id) {
    const wsId = String(id || "");
    setActiveWorkspaceId(wsId);
    if (wsId) localStorage.setItem(STORAGE_KEY, wsId);
    else localStorage.removeItem(STORAGE_KEY);
  }

  // Load my workspaces once logged in (and whenever refreshKey changes)
  useEffect(() => {
    let alive = true;

    async function run() {
      // Not logged in: clear everything
      if (!user?.uid) {
        setWorkspaces([]);
        setActiveIdPersist("");
        setMembership(null);
        setLoadingWorkspaces(false);
        return;
      }

      setLoadingWorkspaces(true);

      try {
        const ws = await getMyWorkspaces(user.uid);
        if (!alive) return;

        setWorkspaces(ws);

        // If no workspaces, clear active selection
        if (!ws || ws.length === 0) {
          setActiveIdPersist("");
          return;
        }

        // If we have an active id saved, ensure it still exists
        const hasSaved = !!activeWorkspaceId;
        const savedIsValid = hasSaved && ws.some((w) => w.id === activeWorkspaceId);

        if (savedIsValid) {
          // Keep it
          return;
        }

        // If saved is missing/invalid:
        // Most pleasant UX: if only 1 workspace, auto-select it.
        if (ws.length === 1) {
          setActiveIdPersist(ws[0].id);
          return;
        }

        // Otherwise, clear it so user is forced to choose
        setActiveIdPersist("");
      } catch (e) {
        console.error("getMyWorkspaces failed:", e);
        if (!alive) return;
        setWorkspaces([]);
        setActiveIdPersist("");
      } finally {
        if (alive) setLoadingWorkspaces(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
    // NOTE: include activeWorkspaceId so we can validate it after workspace fetch
  }, [user?.uid, refreshKey, activeWorkspaceId]);

  // Load membership for active workspace
  useEffect(() => {
    let alive = true;

    async function run() {
      if (!user?.uid || !activeWorkspaceId) {
        setMembership(null);
        return;
      }

      setLoadingMembership(true);
      try {
        const m = await getMyMembership(activeWorkspaceId, user.uid);
        if (!alive) return;
        setMembership(m);
      } catch (e) {
        console.error("getMyMembership failed:", e);
        if (!alive) return;
        setMembership(null);
      } finally {
        if (alive) setLoadingMembership(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [user?.uid, activeWorkspaceId]);

  function selectWorkspace(id) {
    setActiveIdPersist(id);
  }

  const activeWorkspace = useMemo(() => {
    return workspaces.find((w) => w.id === activeWorkspaceId) || null;
  }, [workspaces, activeWorkspaceId]);

  const role = membership?.role || "";

  // ✅ Keep provider value stable (helps Fast Refresh)
  const value = useMemo(() => {
    return {
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      selectWorkspace,

      membership,
      role,

      loadingWorkspaces,
      loadingMembership,

      refreshWorkspaces,
    };
  }, [
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    membership,
    role,
    loadingWorkspaces,
    loadingMembership,
  ]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}