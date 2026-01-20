// src/pages/SignIn.jsx
import { useState } from "react";
import { signIn, signUp } from "../services/auth";
import "./SignIn.css";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      // AuthContext listener should route after login
    } catch (err) {
      setError(err?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAccount(e) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter an email.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await signUp(cleanEmail, password);
      // AuthContext listener should route after signup
    } catch (err) {
      setError(err?.message || "Create account failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="si-wrap">
      <div className="si-card">
        <div className="si-header">
          <div>
            <h1 className="si-title">Sign In</h1>
            <div className="si-subtitle">
              Access your workspaces and property tracker.
            </div>
          </div>
        </div>

        <form className="si-form" onSubmit={handleSignIn}>
          <div className="si-field">
            <div className="si-label">Email</div>
            <input
              className="si-input"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div className="si-field">
            <div className="si-label">Password</div>
            <input
              className="si-input"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="si-actions">
            <button
              className="btn si-btn si-btnPrimary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Working..." : "Sign In"}
            </button>

            <button
              className="btn si-btn si-btnGhost"
              type="button"
              onClick={handleCreateAccount}
              disabled={loading}
            >
              {loading ? "Working..." : "Create Account"}
            </button>
          </div>
        </form>

        {error ? <div className="si-error">{error}</div> : null}

        <div className="si-footnote">
          Tip: Use “Create Account” only once. After that, just sign in.
        </div>
      </div>
    </div>
  );
}