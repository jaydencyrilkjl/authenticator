import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert";
import FaceCapture from "./components/FaceCapture";
import { ThemeContext } from "./App";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [showProSpinner, setShowProSpinner] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [proDigits, setProDigits] = useState(["", "", "", "", "", "", ""]);
  const [proStep, setProStep] = useState(1); // 1: enter SPOTID, 2: enter password
  const [proSpotId, setProSpotId] = useState("");
  const [proPassword, setProPassword] = useState("");
  const [proUserName, setProUserName] = useState("");
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  const [emailVerifyPolling, setEmailVerifyPolling] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const closeAlert = () => {
    setShowAlert(false);
    setAlertMessage("");
  };

  const togglePassword = (fieldId) => {
    const field = document.getElementById(fieldId);
    field.type = field.type === "password" ? "text" : "password";
  };

  const handleProDigitChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return; // Only allow single digit
    const newDigits = [...proDigits];
    newDigits[idx] = val;
    setProDigits(newDigits);
    // Move to next input if digit entered
    if (val && idx < 6) {
      const nextInput = document.getElementById(`pro-digit-${idx + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleProSpotIdSubmit = async () => {
    const spotId = proDigits.join("");
    if (spotId.length !== 7) {
      showAlertMessage("Please enter a valid 7-digit SPOTID");
      return;
    }
    setShowProSpinner(true);
    try {
      const response = await fetch("https://tradespots.online/api/auth/verify-spotid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId }),
      });
      const result = await response.json();
      setShowProSpinner(false);
      if (response.ok) {
        setProSpotId(spotId);
        setProUserName(result.fullName || "");
        setProStep(2);
      } else {
        showAlertMessage(result.message || "SPOTID not found");
      }
    } catch (error) {
      setShowProSpinner(false);
      showAlertMessage("Error connecting to the server");
    }
  };

  const handleProPasswordSubmit = async () => {
    if (!proPassword) {
      showAlertMessage("Please enter your password");
      return;
    }
    setShowProSpinner(true);
    try {
      const response = await fetch("https://tradespots.online/api/auth/spotid-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId: proSpotId, password: proPassword }),
      });
      const result = await response.json();
      setShowProSpinner(false);
      if (response.ok) {
        localStorage.setItem("authToken", result.token);
        localStorage.setItem("userId", result.userId);
        localStorage.setItem("userName", result.name);
        setShowProModal(false);
        setProStep(1);
        setProPassword("");
        setProDigits(["", "", "", "", "", "", ""]);
        navigate("/dashboard");
      } else {
        showAlertMessage(result.message || "Incorrect password");
      }
    } catch (error) {
      setShowProSpinner(false);
      showAlertMessage("Error connecting to the server");
    }
  };

  const handleTradeSpotLogin = () => {
    setShowProSpinner(true);
    setTimeout(() => {
      setShowProSpinner(false);
      setShowProModal(true);
    }, 5000);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setShowSpinner(true);
    try {
        // Validate email and password with the backend
        const response = await fetch("https://tradespots.online/api/auth/validate-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const result = await response.json();
        setShowSpinner(false);

        if (response.ok && result.valid) {
            // Open the face capture modal if credentials are valid
            setShowFaceModal(true);
        } else {
            // Show an alert message if validation fails
            showAlertMessage(result.message || "Invalid email or password.");
        }
    } catch (error) {
        setShowSpinner(false);
        showAlertMessage("Error validating login credentials.");
        console.error("Login validation error:", error);
    }
  };

  // Enable face login: send captured image to backend for verification
  const handleFaceModalCapture = async (img) => {
    setShowFaceModal(false);
    if (img) {
      setShowSpinner(true);
      try {
        // Send face image to backend for verification
        const response = await fetch("https://tradespots.online/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, faceImage: img }),
        });
        const result = await response.json();
        setShowSpinner(false);
        if (response.ok && result.token) {
          localStorage.setItem("authToken", result.token);
          localStorage.setItem("userId", result.userId);
          localStorage.setItem("userName", result.name);
          navigate("/dashboard");
        } else if (result.emailVerification) {
          setPendingEmail(result.email);
          setShowEmailVerifyModal(true);
          setEmailVerifyPolling(true);
        } else {
          showAlertMessage(result.message || "Face login failed.");
        }
      } catch (error) {
        setShowSpinner(false);
        showAlertMessage("Error processing face image.");
        console.error("Face processing error:", error);
      }
    }
  };

  // Poll for email verification status
  useEffect(() => {
    let intervalId;
    if (emailVerifyPolling && pendingEmail) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`https://tradespots.online/api/auth/login-email-status?email=${encodeURIComponent(pendingEmail)}`);
          const data = await res.json();
          if (data.verified && data.token) {
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("userName", data.name);
            setShowEmailVerifyModal(false);
            setEmailVerifyPolling(false);
            setPendingEmail("");
            navigate("/dashboard");
          }
        } catch (e) {
          // Ignore polling errors
        }
      }, 2000);
    }
    return () => intervalId && clearInterval(intervalId);
  }, [emailVerifyPolling, pendingEmail, navigate]);

  const handleFaceModalClose = () => {
    setShowFaceModal(false);
  };

  return (
    <div
      style={{
        backgroundColor: theme === "dark" ? "#121212" : "#f2f4f8",
        color: theme === "dark" ? "#f1f1f1" : "#333",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', sans-serif",
        transition: "background-color 0.3s",
      }}
    >
      {showAlert && <StyledAlert message={alertMessage} onClose={closeAlert} />}
      {/* Overlay for spinner */}
      {showProSpinner && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              border: "6px solid #f3f3f3",
              borderTop: `6px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>
            {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
          </style>
        </div>
      )}
      {/* Pro Modal */}
      {showProModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.85)",
            zIndex: 10000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: theme === "dark" ? "#181a20" : "#222",
              borderRadius: "12px",
              padding: "24px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
              minWidth: "220px",
              maxWidth: "90vw",
              width: "260px",
              textAlign: "center",
            }}
          >
            {proStep === 1 ? (
              <>
                <h2 style={{ marginBottom: 14, color: "#fff" }}>SPOTID</h2>
                <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginBottom: 14 }}>
                  {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                    <input
                      key={idx}
                      id={`pro-digit-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={proDigits[idx]}
                      onChange={(e) => handleProDigitChange(idx, e.target.value)}
                      style={{
                        width: "28px",
                        height: "34px",
                        fontSize: "1.1rem",
                        textAlign: "center",
                        border: "2px solid #1e88e5",
                        borderRadius: "6px",
                        background: "#23272f",
                        color: "#fff",
                        outline: "none",
                      }}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
                <button
                  style={{
                    width: "100%",
                    padding: "8px",
                    backgroundColor: "#1e88e5",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "15px",
                    marginTop: "6px",
                  }}
                  onClick={handleProSpotIdSubmit}
                >
                  Next
                </button>
                <button
                  style={{ marginTop: 10, background: "none", color: "#fff", border: "none", cursor: "pointer" }}
                  onClick={() => { setShowProModal(false); setProStep(1); setProDigits(["", "", "", "", "", "", ""]); }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h2 style={{ marginBottom: 10, color: "#fff" }}>Welcome {proUserName ? proUserName : ""}</h2>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={proPassword}
                  onChange={e => setProPassword(e.target.value)}
                  style={{
                    width: "90%",
                    padding: "10px",
                    marginBottom: "15px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    fontSize: "16px",
                    background: "#23272f",
                    color: "#fff",
                  }}
                />
                <button
                  style={{
                    width: "100%",
                    padding: "8px",
                    backgroundColor: "#1e88e5",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "15px",
                    marginTop: "6px",
                  }}
                  onClick={handleProPasswordSubmit}
                >
                  Login
                </button>
                <button
                  style={{ marginTop: 10, background: "none", color: "#fff", border: "none", cursor: "pointer" }}
                  onClick={() => { setProStep(1); setProPassword(""); setProDigits(["", "", "", "", "", "", ""]); }}
                >
                  Back
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Email Verification Modal */}
      {showEmailVerifyModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.7)",
            zIndex: 11000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              background: theme === "dark" ? "#181a20" : "#fff",
              borderRadius: "16px",
              padding: "36px 28px 28px 28px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
              minWidth: "320px",
              maxWidth: "90vw",
              textAlign: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                border: "8px solid #eee",
                borderTop: `8px solid ${theme === "dark" ? "#1e88e5" : "#27ae60"}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 24px auto",
              }}
            />
            <h2 style={{ fontWeight: "bold", marginBottom: 12, color: theme === "dark" ? "#fff" : "#222" }}>
              VERIFY LOGIN FROM EMAIL
            </h2>
            <p style={{ color: theme === "dark" ? "#ccc" : "#444", fontSize: 16, marginBottom: 0 }}>
              Please check your email and click the Verify button to complete login.<br/>
            </p>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}
      {/* Main Login Card */}
      <div
        style={{
          background: theme === "dark" ? "#333" : "#fff",
          borderTop: `4px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
          borderRadius: "12px",
          padding: "30px",
          width: "350px",
          boxShadow: theme === "dark"
            ? "0 8px 20px rgba(255,255,255,0.15)"
            : "0 8px 20px rgba(0, 0, 0, 0.15)",
          position: "relative",
        }}
      >
        <button
          style={{
            position: "absolute",
            top: "30px",
            right: "20px",
            backgroundColor: theme === "dark" ? "#1e88e5" : "#007bff",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "10px",
            fontWeight: "bold",
            boxShadow: theme === "dark"
              ? "0 4px 10px rgba(30,136,229,0.2)"
              : "0 4px 10px rgba(0, 0, 0, 0.1)",
            border: "none",
            transition: "background-color 0.3s ease, transform 0.2s ease",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          Home
        </button>
        <h2
          style={{
            textAlign: "center",
            color: theme === "dark" ? "#f1f1f1" : "#333",
            marginBottom: "20px",
            borderBottom: `2px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
            paddingBottom: "10px",
            fontSize: "28px",
          }}
        >
          Login
        </h2>
        <form id="loginForm" onSubmit={handleLogin}>
          <label style={{ color: theme === "dark" ? "#f1f1f1" : "#333", fontWeight: "bold", display: "block", margin: "10px 0 5px" }}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "16px",
              boxSizing: "border-box",
              background: theme === "dark" ? "#222" : "#fff",
              color: theme === "dark" ? "#f1f1f1" : "#333",
            }}
          />
          <label style={{ color: theme === "dark" ? "#f1f1f1" : "#333", fontWeight: "bold", display: "block", margin: "10px 0 5px" }}>
            Password:
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                fontSize: "16px",
                boxSizing: "border-box",
                background: theme === "dark" ? "#222" : "#fff",
                color: theme === "dark" ? "#f1f1f1" : "#333",
              }}
            />
            <button
              type="button"
              onClick={() => togglePassword("password")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                color: theme === "dark" ? "#1e88e5" : "#007bff",
              }}
            >
              👁
            </button>
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: theme === "dark" ? "#1e88e5" : "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
              transition: "background-color 0.3s ease, transform 0.3s ease",
            }}
          >
            Login
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: "15px", color: theme === "dark" ? "#f1f1f1" : "#333" }}>
          <button
            onClick={() => navigate("/forgot-password-and-verify")}
            style={{
              background: "none",
              border: "none",
              color: theme === "dark" ? "#1e88e5" : "#007bff",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Forgot Password?
          </button>
        </p>
        <p style={{ textAlign: "center", marginTop: "15px", color: theme === "dark" ? "#f1f1f1" : "#333" }}>
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            style={{
              background: "none",
              border: "none",
              color: theme === "dark" ? "#1e88e5" : "#007bff",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Signup
          </button>
        </p>
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <a
            href="https://t.me/tradespothelp"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: theme === "dark" ? "#1e88e5" : "#007bff", textDecoration: "none" }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg"
              alt="Telegram"
              style={{ width: "20px", verticalAlign: "middle", marginRight: "5px" }}
            />
            Contact Customer Service
          </a>
        </div>
        <button
          style={{
            width: "100%",
            marginTop: "15px",
            padding: "0",
            border: "none",
            borderRadius: "5px",
            background: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: theme === "dark"
              ? "0 2px 6px rgba(255,255,255,0.08)"
              : "0 2px 6px rgba(0,0,0,0.08)",
            transition: "box-shadow 0.2s",
            height: "48px",
            fontFamily: "'Segoe UI', sans-serif",
          }}
          onClick={handleTradeSpotLogin}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: "16px",
              color: theme === "dark" ? "#f1f1f1" : "#222",
              letterSpacing: "0.5px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            Or Login with
            <img
              src={require("./tradespot-login.jpg")}
              alt="SPOTID"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
                objectFit: "cover",
                verticalAlign: "middle",
                cursor: "pointer",
              }}
            />
          </span>
        </button>
        {showSpinner && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "5px solid #f3f3f3",
                borderTop: `5px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
          </div>
        )}
        {showFaceModal && (
          <FaceCapture
            visible={showFaceModal}
            onCapture={handleFaceModalCapture}
            onClose={handleFaceModalClose}
            instruction="Align your face in the circle and capture to login"
          />
        )}
      </div>    </div>
  );
}

export default Login;