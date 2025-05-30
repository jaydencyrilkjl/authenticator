import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function isApp() {
  // Only return true if running inside a native Capacitor/Cordova app
  return (
    typeof window !== 'undefined' &&
    (
      (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
      window.cordova
    )
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const handlePlaystore = () => {
    alert("Feature coming soon");
  };
  const handleAPK = () => {
    window.open("https://eloquent-kashata-b27599.netlify.app/tradespot.apk", "_blank");
  };
  const handleVisitWebsite = () => {
    window.open("https://tradespot.online", "_blank");
  };

  return (
    <div
      style={{
        margin: 0,
        fontFamily: "'Segoe UI', sans-serif",
        background: "linear-gradient(135deg, #0a1e40, #003366)",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "15px 20px",
          background: "linear-gradient(135deg, #0a1e40, #003366)",
          boxShadow: "0 2px 6px rgba(0, 0, 50, 0.3)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: "26px",
            fontWeight: "bold",
            color: "#00bfff",
            marginBottom: "10px",
          }}
        >
          TradeSpot
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "10px 16px",
              background: "linear-gradient(90deg, #00bfff, #0056b3)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background 0.3s, transform 0.2s",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              width: "100%",
              maxWidth: "300px",
            }}
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            style={{
              padding: "10px 16px",
              background: "linear-gradient(90deg, #00bfff, #0056b3)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background 0.3s, transform 0.2s",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              width: "100%",
              maxWidth: "300px",
            }}
          >
            Sign Up
          </button>
          <button
            onClick={() => {
              if (localStorage.getItem("authToken")) {
                navigate("/dashboard");
              } else {
                alert("Please log in to access the dashboard");
                navigate("/login");
              }
            }}
            style={{
              padding: "10px 16px",
              background: "linear-gradient(90deg, #00bfff, #0056b3)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background 0.3s, transform 0.2s",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              width: "100%",
              maxWidth: "300px",
            }}
          >
            Dashboard
          </button>
          {/* Removed Social Hub button */}
          {isApp() ? (
            <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
              <button
                onClick={handleVisitWebsite}
                style={{
              padding: "10px 16px",
              background: "linear-gradient(90deg, #00bfff, #0056b3)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background 0.3s, transform 0.2s",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              width: "100%",
              maxWidth: "300px",
            }}
              >
                Visit Website
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "10px 16px",
                background: "linear-gradient(90deg, #00bfff, #0056b3)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background 0.3s, transform 0.2s",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                width: "100%",
                maxWidth: "300px",
              }}
            >
              Download App
            </button>
          )}
        </div>
      </header>
      <main
        style={{
          textAlign: "center",
          marginTop: "20px",
          maxWidth: "90%",
          background: "#fff",
          color: "#333",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "20px",
            color: "#003366",
          }}
        >
          Invest Smart. Grow with Confidence.
        </div>
        <div
          style={{
            fontSize: "14px",
            lineHeight: "1.5",
            marginBottom: "20px",
          }}
        >
          Welcome to <strong>TradeSpot</strong>, your trusted partner in simplified, secure, and
          powerful cryptocurrency investing. At TradeSpot, we bring innovation and user experience
          together, allowing you to invest in multiple crypto plans, track your earnings, and manage
          your funds with ease — all from a single, streamlined platform.<br />
          <br />
          Whether you're a beginner or a seasoned trader, TradeSpot is built to help you make smarter
          decisions. With real-time crypto market data, automated investment tracking, referral
          benefits, and instant USDT (TRC-20) deposits, we provide everything you need to grow your
          digital assets — without the complexity.<br />
          <br />
          Your dashboard gives you full visibility into your profile, current investment plans,
          wallet balance, transaction history, and team referrals. Security and transparency are our
          core values, and we ensure your data is encrypted and protected at every step.<br />
          <br />
          Start your crypto journey the right way — join the platform where{" "}
          <strong>every click counts towards your financial future</strong>.
        </div>
      </main>
      {!isApp() && showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.35)",
            zIndex: 20000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 28,
              minWidth: 260,
              maxWidth: "90vw",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 14,
                background: "none",
                border: "none",
                fontSize: 22,
                color: "#888",
                cursor: "pointer",
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <div style={{ fontWeight: 700, fontSize: 20, color: "#003366", marginBottom: 18 }}>
              Download TradeSpot App
            </div>
            <button
              onClick={handlePlaystore}
              style={{
                width: "100%",
                maxWidth: 260,
                margin: "8px 0",
                padding: "10px 0",
                background: "#34a853",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 20, marginRight: 8 }}>▶️</span> Download on Playstore
            </button>
            <button
              onClick={handleAPK}
              style={{
                width: "100%",
                maxWidth: 260,
                margin: "8px 0",
                padding: "10px 0",
                background: "#4285f4",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 20, marginRight: 8 }}>⬇️</span> Download APK
            </button>
          </div>
        </div>
      )}    </div>
  );
}

export default HomePage;