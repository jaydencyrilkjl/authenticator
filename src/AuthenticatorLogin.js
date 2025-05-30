import React, { useState } from "react";

const AuthenticatorLogin = ({ onLogin }) => {
  const [spotId, setSpotId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://tradespots.online/api/auth/spotid-login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-authenticator-login": "true" },
        body: JSON.stringify({ spotId, password }),
      });
      const data = await res.json();
      if (res.ok && data.token && data.userId) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userId", data.userId);
        if (onLogin) onLogin();
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fafdff"
      }}
    >
      <div style={{ maxWidth: 340, width: "100%", padding: 28, borderRadius: 14, background: "#fff", boxShadow: "0 4px 18px rgba(0,0,0,0.10)", textAlign: "center" }}>
        <h2 style={{ color: "#0056b3", fontWeight: 700, marginBottom: 18 }}>Authenticator Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="SPOTID"
            value={spotId}
            onChange={e => setSpotId(e.target.value)}
            maxLength={7}
            style={{ width: "90%", padding: 12, marginBottom: 14, border: "1.5px solid #00bfff", borderRadius: 8, fontSize: 17, letterSpacing: 2 }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: "90%", padding: 12, marginBottom: 18, border: "1.5px solid #00bfff", borderRadius: 8, fontSize: 17 }}
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: "90%", padding: "10px 0", background: "linear-gradient(90deg, #00bfff 60%, #0056b3 100%)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && <div style={{ color: "#d32f2f", marginTop: 12 }}>{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default AuthenticatorLogin;