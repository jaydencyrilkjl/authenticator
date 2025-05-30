import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert";
import { ThemeContext } from "./App"; // Import ThemeContext

// Improved: Bracket only in-between zeros (not leading zeros)
function formatSpotBalance(val) {
  if (typeof val !== "number") return "0.00 SPOT";
  const str = val.toString();
  if (!str.includes(".")) return str + " SPOT";
  const [int, dec] = str.split(".");
  // Find the longest run of zeros between non-zero digits
  let maxRun = 0, maxStart = -1;
  let run = 0, start = -1;
  for (let i = 0; i < dec.length; i++) {
    if (dec[i] === "0") {
      if (run === 0) start = i;
      run++;
    } else {
      if (run > 1 && i !== run) { // Only in-between zeros
        if (run > maxRun) {
          maxRun = run;
          maxStart = start;
        }
      }
      run = 0;
      start = -1;
    }
  }
  // If the run is at the end and not leading
  if (run > 1 && start > 0 && start + run === dec.length) {
    if (run > maxRun) {
      maxRun = run;
      maxStart = start;
    }
  }
  if (maxRun > 1 && maxStart > 0) {
    // Bracket the in-between zeros
    return `${int}.${dec.slice(0, maxStart)}(${maxRun})${dec.slice(maxStart + maxRun)} SPOT`;
  }
  return str + " SPOT";
}

function Profile() {
  const [userData, setUserData] = useState(null);
  const [activeInvestments, setActiveInvestments] = useState([]);
  const [detailsHidden, setDetailsHidden] = useState(() => {
    const stored = localStorage.getItem('profileDetailsHidden');
    return stored === 'true';
  });
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState(null);
  const [showInvestmentsModal, setShowInvestmentsModal] = useState(false);
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext); // Use theme context

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setAlertMessage("User not logged in!");
      setAlertCallback(() => () => navigate("/login"));
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("https://tradespots.online/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setAlertMessage("Session expired. Please log in again.");
            setAlertCallback(() => () => {
              localStorage.removeItem("authToken");
              navigate("/login");
            });
          } else {
            throw new Error("Failed to fetch profile");
          }
        }

        const data = await response.json();
        setUserData({
          fullName: data.user?.fullName || "",
          email: data.user?.email || "",
          usdtBalance: typeof data.user?.usdtBalance === "number"
            ? `$${data.user.usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : (typeof data.user?.balance === "number"
                ? `$${data.user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "$0.00"),
          spotBalance: formatSpotBalance(data.user?.spotBalance),
          walletAddress: data.user?.walletAddress || "N/A",
        });

        const userId = localStorage.getItem("userId");
        if (!userId) {
          throw new Error("User ID not found in localStorage.");
        }

        const investResp = await fetch(`https://tradespots.online/api/investments/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!investResp.ok) {
          throw new Error("Failed to fetch investments");
        }

        const investments = await investResp.json();
        setActiveInvestments(investments.filter((investment) => investment.status === "active"));
      } catch (error) {
        console.error("Error loading profile:", error);
        setAlertMessage("Error loading profile. Please try again.");
        setAlertCallback(() => () => navigate("/login"));
      }
    };

    fetchProfile();
  }, [navigate]);

  const toggleDetails = () => {
    setDetailsHidden(prev => {
      localStorage.setItem('profileDetailsHidden', !prev);
      return !prev;
    });
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  return (
    <div
      style={{
        margin: 0,
        fontFamily: "'Segoe UI', 'Arial Black', 'Arial', sans-serif",
        backgroundColor: theme === "dark" ? "#121212" : "#f2f4f8",
        color: theme === "dark" ? "#f1f1f1" : "#333",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        position: "relative",
      }}
    >
      {/* StyledAlert */}
      {alertMessage && (
        <StyledAlert
          message={alertMessage}
          onClose={() => {
            setAlertMessage("");
            setAlertCallback(null);
          }}
          onConfirm={alertCallback}
        />
      )}
      <button
        onClick={handleBack}
        style={{
          position: "absolute",
          top: "30px",
          left: "10px",
          fontSize: "10px",
          backgroundColor: theme === "dark" ? "#1e88e5" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          padding: "8px 14px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
          transition: "background-color 0.3s ease, transform 0.3s ease",
          fontWeight: "bold",
          fontFamily: "'Segoe UI', 'Arial Black', 'Arial', sans-serif",
        }}
      >
        🔙Back
      </button>
      <button
        onClick={toggleDetails}
        style={{
          position: "absolute",
          top: "30px",
          right: "10px",
          fontSize: "10px",
          backgroundColor: theme === "dark" ? "#1e88e5" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          padding: "8px 14px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
          transition: "background-color 0.3s ease, transform 0.3s ease",
          fontWeight: "bold",
          fontFamily: "'Segoe UI', 'Arial Black', 'Arial', sans-serif",
        }}
      >
        {detailsHidden ? "Show Details" : "Hide Details"}
      </button>
      <div
        style={{
          background: theme === "dark" ? "#333" : "#fff",
          padding: "20px 15px",
          borderRadius: "12px",
          maxWidth: "400px",
          width: "100%",
          boxShadow:
            theme === "dark"
              ? "0 8px 20px rgba(255,255,255,0.15)"
              : "0 8px 20px rgba(0,0,0,0.15)",
          borderTop: `4px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
          textAlign: "center",
          fontFamily: "'Segoe UI', 'Arial Black', 'Arial', sans-serif",
        }}
      >
        <h1
          style={{
            color: theme === "dark" ? "#fff" : "#111",
            marginBottom: "10px",
            fontSize: "20px",
            borderBottom: `2px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
            paddingBottom: "6px",
            fontWeight: 900,
            fontFamily: "'Arial Black', 'Segoe UI', 'Arial', 'Montserrat', 'Roboto', sans-serif",
            letterSpacing: "1px",
            textTransform: "uppercase",
            textShadow: "none",
            background: "none",
            WebkitBackgroundClip: "initial",
            WebkitTextFillColor: "initial",
            display: "inline-block",
          }}
        >
          {userData ? userData.fullName : "Loading..."}
        </h1>
        <div
          style={{
            background: theme === "dark" ? "#222" : "#f9f9f9",
            padding: "10px 12px",
            marginBottom: "12px",
            borderLeft: `4px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
            borderRadius: "4px",
            display: "flex",
            justifyContent: "space-between",
            color: theme === "dark" ? "#f1f1f1" : "#555",
            fontSize: "14px",
            fontWeight: "bold",
            fontFamily: "'Segoe UI', 'Arial Black', 'Arial', sans-serif",
          }}
        >
          <span>Email:</span>
          <span>{detailsHidden ? "******" : userData?.email || "Loading..."}</span>
        </div>
        {/* USDT Balance Row */}
        <div
          style={{
            background: theme === "dark" ? "#222" : "#f9f9f9",
            padding: "10px 12px",
            marginBottom: "12px",
            borderLeft: `4px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
            borderRadius: "4px",
            display: "flex",
            justifyContent: "space-between",
            color: theme === "dark" ? "#f1f1f1" : "#555",
            fontSize: "14px",
            fontWeight: "bold",
            fontFamily: "'Segoe UI', 'Arial Black', 'Arial', sans-serif",
          }}
        >
          <span>USDT Balance:</span>
          <span>{detailsHidden ? "******" : userData?.usdtBalance || "$0.00"}</span>
        </div>
        {/* SPOT Balance Row */}
        <div
          style={{
            background: theme === "dark" ? "#222" : "#f9f9f9",
            padding: "10px 12px",
            marginBottom: "12px",
            borderLeft: `4px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
            borderRadius: "4px",
            display: "flex",
            justifyContent: "space-between",
            color: theme === "dark" ? "#f1f1f1" : "#555",
            fontSize: "14px",
            fontWeight: "bold",
            fontFamily: "'Segoe UI', 'Arial Black', 'Arial', sans-serif",
          }}
        >
          <span>SPOT Balance:</span>
          <span>{detailsHidden ? "******" : userData?.spotBalance || "0.00 SPOT"}</span>
        </div>
        <div
          style={{
            background: theme === "dark" ? "#222" : "#f9f9f9",
            padding: "10px 12px",
            marginBottom: "12px",
            borderLeft: `4px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
            borderRadius: "4px",
            display: "flex",
            justifyContent: "space-between",
            color: theme === "dark" ? "#f1f1f1" : "#555",
            fontSize: "14px",
            fontWeight: "bold",
            fontFamily: "'Segoe UI', 'Arial Black', 'Arial', sans-serif",
          }}
        >
          <span>Wallet Address:</span>
          <span
            style={{
              maxWidth: "60vw",
              overflowX: "auto",
              whiteSpace: "nowrap",
              display: "inline-block",
              textAlign: "right",
            }}
          >
            {detailsHidden ? "******" : userData?.walletAddress || "N/A"}
          </span>
        </div>
        <div style={{ marginTop: "15px" }}>
          <h2
            style={{
              color: theme === "dark" ? "#1e88e5" : "#007bff",
              marginBottom: "10px",
              borderBottom: "1px solid #ddd",
              paddingBottom: "5px",
              fontWeight: "bold",
              fontFamily: "'Segoe UI', 'Arial Black', 'Arial', sans-serif",
              letterSpacing: "0.5px",
            }}
          >
            Active Investments
          </h2>
          <div style={{ position: 'relative', width: 64, height: 64, margin: '18px auto 10px auto' }}>
            <button
              onClick={() => setShowInvestmentsModal(true)}
              style={{
                fontWeight: 900,
                fontSize: 15,
                background: theme === 'dark' ? '#1e88e5' : '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 64,
                height: 64,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.13)',
                letterSpacing: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s, transform 0.2s',
                outline: 'none',
                position: 'relative',
                zIndex: 2,
              }}
              aria-label="View Active Investments"
            >
              VIEW
            </button>
            {/* Animated green border only if there are active investments */}
            {activeInvestments.length > 0 && (
              <svg
                width="64"
                height="64"
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 3, pointerEvents: 'none' }}
              >
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#00e676"
                  strokeWidth="4"
                  strokeDasharray="44 160"
                  strokeDashoffset={-Date.now() / 30 % 204}
                  style={{
                    transition: 'stroke-dashoffset 0.2s linear',
                    filter: 'drop-shadow(0 0 4px #00e67688)'
                  }}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 32 32"
                    to="360 32 32"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            )}
          </div>
        </div>
      </div>
      {showInvestmentsModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.45)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowInvestmentsModal(false)}
        >
          <div
            style={{
              background: theme === 'dark' ? '#222' : '#fff',
              borderRadius: 14,
              padding: 24,
              minWidth: 320,
              maxWidth: '95vw',
              maxHeight: '80vh',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              overflowY: 'auto',
              position: 'relative',
              width: 400,
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowInvestmentsModal(false)}
              style={{
                position: 'absolute',
                top: 10,
                right: 18,
                background: 'none',
                border: 'none',
                fontSize: 22,
                color: '#888',
                cursor: 'pointer',
                fontWeight: 700,
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 style={{ color: theme === 'dark' ? '#1e88e5' : '#007bff', marginBottom: 18, fontWeight: 700, textAlign: 'center' }}>Active Investments</h2>
            <div style={{ overflowY: 'auto', maxHeight: '60vh', width: '100%' }}>
              {activeInvestments.length > 0 ? (
                activeInvestments.map((investment, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "10px",
                      padding: "10px",
                      background: theme === "dark" ? "#333" : "#fff",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                      fontSize: "13px",
                      color: theme === "dark" ? "#f1f1f1" : "#333",
                      fontWeight: "bold",
                      fontFamily: "'Segoe UI', 'Arial Black', 'Arial', sans-serif",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <span
                      className="active-investment-animated-border"
                      style={{
                        pointerEvents: "none",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        borderRadius: "6px",
                        boxSizing: "border-box",
                        zIndex: 1,
                      }}
                    />
                    <div style={{ position: "relative", zIndex: 2 }}>
                      <p>
                        <strong>Plan:</strong> {investment.plan}
                      </p>
                      <p>
                        <strong>Amount:</strong> ${investment.amount}
                      </p>
                      <p>
                        <strong>Start Date:</strong>{" "}
                        {new Date(investment.startDate).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>End Date:</strong>{" "}
                        {new Date(investment.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", fontSize: "13px", margin: 0, fontWeight: "bold", fontFamily: "'Segoe UI', 'Arial Black', 'Arial', sans-serif" }}>
                  No active investments.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;