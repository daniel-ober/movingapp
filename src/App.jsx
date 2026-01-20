// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useWorkspace } from "./context/WorkspaceContext";

import SignIn from "./pages/SignIn";
import CreateWorkspace from "./pages/CreateWorkspace";
import JoinWorkspace from "./pages/JoinWorkspace";
import SelectWorkspace from "./pages/SelectWorkspace";
import WorkspaceHome from "./pages/WorkspaceHome";
import SuperAdmin from "./pages/SuperAdmin";

function App() {
  const { user, isSuperAdmin } = useAuth();
  const { activeWorkspaceId } = useWorkspace();

  // Not signed in → SignIn only
  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<SignIn />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Signed in
  return (
    <BrowserRouter>
      {/* ✅ Super Admin Console */}
      <Routes>
        <Route
          path="/super-admin"
          element={isSuperAdmin ? <SuperAdmin /> : <Navigate to="/app" replace />}
        />

        <Route path="/select-workspace" element={<SelectWorkspace />} />
        <Route path="/create-workspace" element={<CreateWorkspace />} />
        <Route path="/join" element={<JoinWorkspace />} />

        {/* Workspace app shell */}
        <Route
          path="/app"
          element={
            activeWorkspaceId ? (
              <WorkspaceHome />
            ) : (
              <Navigate to="/select-workspace" replace />
            )
          }
        />

        {/* Default landing */}
        <Route
          path="*"
          element={
            activeWorkspaceId ? (
              <Navigate to="/app" replace />
            ) : (
              <Navigate to="/select-workspace" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;