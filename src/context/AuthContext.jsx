// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { auth } from "../services/firebase";
import { signIn, signUp, logout } from "../services/auth";

const AuthContext = createContext(null);

// ✅ Temporary fallback allowlist so you can move fast even before claims are set.
// We'll remove/disable this once Step 2 rules + Step 3 functions are in place.
const SUPER_ADMIN_EMAIL_ALLOWLIST = ["danober.dev@gmail.com"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);

      if (!u) {
        setClaims({});
        setLoading(false);
        return;
      }

      try {
        // ✅ Pull custom claims (superAdmin, etc.)
        const token = await getIdTokenResult(u, true);
        setClaims(token?.claims || {});
      } catch (e) {
        console.error("[AuthContext] getIdTokenResult failed:", e);
        setClaims({});
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  const isSuperAdmin = useMemo(() => {
    const claim = !!claims?.superAdmin;
    const emailOk = SUPER_ADMIN_EMAIL_ALLOWLIST.includes(
      String(user?.email || "").toLowerCase()
    );
    return claim || emailOk;
  }, [claims, user?.email]);

  const value = useMemo(() => {
    return {
      user,
      loading,
      claims,
      isSuperAdmin,

      // auth actions
      signIn,
      signUp,
      logout,
    };
  }, [user, loading, claims, isSuperAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}