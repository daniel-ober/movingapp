// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useWorkspace } from "./context/WorkspaceContext";

import SignIn from "./pages/SignIn";
import CreateWorkspace from "./pages/CreateWorkspace";
import JoinWorkspace from "./pages/JoinWorkspace";
import SelectWorkspace from "./pages/SelectWorkspace";
import WorkspaceHome from "./pages/WorkspaceHome";

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const { activeWorkspaceId } = useWorkspace();

  // Pleasant UX: show a simple splash while Firebase resolves auth state
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          color: "rgba(255,255,255,0.75)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 900, letterSpacing: 0.3, marginBottom: 6 }}>
            Moving App
          </div>
          <div style={{ fontSize: 13 }}>Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/signin" element={user ? <Navigate to="/" replace /> : <SignIn />} />

      {/* Protected: must be signed in */}
      <Route
        path="/select-workspace"
        element={
          <RequireAuth user={user}>
            <SelectWorkspace />
          </RequireAuth>
        }
      />
      <Route
        path="/create-workspace"
        element={
          <RequireAuth user={user}>
            <CreateWorkspace />
          </RequireAuth>
        }
      />
      <Route
        path="/join"
        element={
          <RequireAuth user={user}>
            <JoinWorkspace />
          </RequireAuth>
        }
      />

      {/* Protected: must be signed in + have active workspace */}
      <Route
        path="/app"
        element={
          <RequireAuth user={user}>
            <RequireWorkspace activeWorkspaceId={activeWorkspaceId}>
              <WorkspaceHome />
            </RequireWorkspace>
          </RequireAuth>
        }
      />

      {/* Default landing */}
      <Route
        path="/"
        element={
          user ? (
            activeWorkspaceId ? (
              <Navigate to="/app" replace />
            ) : (
              <Navigate to="/select-workspace" replace />
            )
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />

      {/* Catch-all */}
      <Route
        path="*"
        element={
          user ? (
            activeWorkspaceId ? (
              <Navigate to="/app" replace />
            ) : (
              <Navigate to="/select-workspace" replace />
            )
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />
    </Routes>
  );
}

function RequireAuth({ user, children }) {
  const location = useLocation();

  if (!user) {
    // Keep a return path so after login you can optionally redirect back later
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function RequireWorkspace({ activeWorkspaceId, children }) {
  if (!activeWorkspaceId) {
    return <Navigate to="/select-workspace" replace />;
  }
  return children;
}

export default App;