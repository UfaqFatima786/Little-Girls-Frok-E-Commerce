import { useState } from "react";
import { Link } from "react-router-dom";
import { Crown, ShieldAlert } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function AdminLogin({ user, onSignOut }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Signed in, but the account's role is not "admin"
  if (user) {
    return (
      <div className="adm-center">
        <div className="adm-card adm-narrow adm-center-text">
          <ShieldAlert size={38} color="var(--pink)" />
          <h2>No admin access</h2>
          <p>
            <b>{user.email}</b> is not an admin account. Ask the store owner to set
            your role to <code>admin</code> in Supabase.
          </p>
          <button className="adm-btn" onClick={onSignOut}>Sign out</button>
          <Link to="/" className="adm-link">Back to store</Link>
        </div>
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);
    if (signInError) setError(signInError.message);
  };

  return (
    <div className="adm-center">
      <form className="adm-card adm-narrow" onSubmit={submit}>
        <div className="adm-login-logo"><Crown size={30} /> Little <b>Princess</b></div>
        <h2>Admin login</h2>

        <label className="adm-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label className="adm-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        {error && <p className="adm-error">{error}</p>}

        <button className="adm-btn" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <Link to="/" className="adm-link">Back to store</Link>
      </form>
    </div>
  );
}
