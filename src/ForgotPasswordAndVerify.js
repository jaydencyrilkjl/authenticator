import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert";
import { ThemeContext } from "./App"; // Import ThemeContext

function ForgotPasswordAndVerify() {
  const { theme } = useContext(ThemeContext); // Use theme context
  const togglePassword = (fieldId) => {
    const field = document.getElementById(fieldId);
    if (field.type === "password") {
      field.type = "text";
    } else {
      field.type = "password";
    }
  };
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [fullName, setFullName] = useState("");
  const [spotId, setSpotId] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState(null);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const requestReset = async () => {
    if (!email) {
      setAlertMessage("Please enter your email address.");
      return;
    }
    try {
      const response = await fetch("https://tradespots.online/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setAlertMessage(data.message);
      if (response.ok) {
        setAlertMessage("Verification code sent to your email.");
        setStep(2);
      }
    } catch (error) {
      setAlertMessage("Unable to connect to the server.");
      console.error(error);
    }
  };

  const verifyCode = async () => {
    if (newPassword !== confirmPassword) {
      setAlertMessage("Passwords do not match.");
      return;
    }
    if (!walletAddress || !fullName || !spotId) {
      setAlertMessage("Please fill in all required fields.");
      return;
    }
    try {
      const response = await fetch("https://tradespots.online/api/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword, walletAddress, fullName, spotId }),
      });
      const data = await response.json();
      setAlertMessage(data.message);
      if (response.ok) {
        setAlertMessage("Password reset successful. Redirecting to login.");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      setAlertMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div
      style={{
        margin: 0,
        fontFamily: "'Segoe UI', sans-serif",
        backgroundColor: theme === "dark" ? "#121212" : "#f2f4f8",
        color: theme === "dark" ? "#f1f1f1" : "#333",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
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
        onClick={() => {
          if (window.history.length > 1) navigate(-1);
          else navigate("/dashboard");
        }}
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
          boxShadow: theme === "dark"
            ? "0 4px 6px rgba(30,136,229,0.2)"
            : "0 4px 6px rgba(0, 0, 0, 0.2)",
          transition: "background-color 0.3s ease, transform 0.3s ease",
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = theme === "dark" ? "#1565c0" : "#0056b3")}
        onMouseOut={(e) => (e.target.style.backgroundColor = theme === "dark" ? "#1e88e5" : "#007bff")}
      >
        🔙 Back
      </button>

      {step === 1 && (
        <div
          style={{
            background: theme === "dark" ? "#333" : "#fff",
            borderTop: `4px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
            borderRadius: "12px",
            padding: "30px",
            width: "100%",
            maxWidth: "360px",
            boxShadow: theme === "dark"
              ? "0 8px 20px rgba(255,255,255,0.10)"
              : "0 8px 20px rgba(0, 0, 0, 0.15)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              marginBottom: "20px",
              fontSize: "28px",
              color: theme === "dark" ? "#f1f1f1" : "#333",
              borderBottom: `2px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
              paddingBottom: "10px",
            }}
          >
            Forgot Password
          </h2>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "20px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "16px",
              boxSizing: "border-box",
              background: theme === "dark" ? "#222" : "#fff",
              color: theme === "dark" ? "#f1f1f1" : "#333",
            }}
          />
          <button
            onClick={requestReset}
            style={{
              backgroundColor: theme === "dark" ? "#1e88e5" : "#007bff",
              color: "#fff",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
              transition: "background-color 0.3s ease, transform 0.3s ease",
              width: "100%",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = theme === "dark" ? "#1565c0" : "#0056b3")}
            onMouseOut={(e) => (e.target.style.backgroundColor = theme === "dark" ? "#1e88e5" : "#007bff")}
          >
            Send Reset Code
          </button>
        </div>
      )}

      {step === 2 && (
        <div
          style={{
            background: theme === "dark" ? "#333" : "#fff",
            padding: "30px",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "100%",
            marginTop: "80px",
            boxShadow: theme === "dark"
              ? "0 8px 20px rgba(255,255,255,0.10)"
              : "0 8px 20px rgba(0, 0, 0, 0.15)",
            borderTop: `4px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              marginBottom: "20px",
              fontSize: "28px",
              color: theme === "dark" ? "#f1f1f1" : "#333",
              borderBottom: `2px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
              paddingBottom: "10px",
            }}
          >
            Verify Code
          </h2>
          <div
            style={{
              background: theme === "dark" ? "#222" : "#fff",
              padding: "20px",
              borderRadius: "10px",
              marginTop: "20px",
              border: "1px solid #e0e0e0",
              boxShadow: theme === "dark"
                ? "0 2px 8px rgba(255,255,255,0.07)"
                : "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <input
              type="text"
              id="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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
            <input
              type="text"
              id="walletAddress"
              placeholder="Enter your wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
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
            <input
              type="text"
              id="spotId"
              placeholder="Enter your SPOTID"
              value={spotId}
              onChange={(e) => setSpotId(e.target.value)}
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
            <input
              type="text"
              id="code"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
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
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <input
                type="password"
                id="newPassword"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
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
                onClick={() => togglePassword("newPassword")}
                style={{
                  position: "absolute",
                  right: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  fontSize: "16px",
                  cursor: "pointer",
                  color: theme === "dark" ? "#1e88e5" : "#007bff",
                }}
              >
                👁
              </button>
            </div>
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
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
                onClick={() => togglePassword("confirmPassword")}
                style={{
                  position: "absolute",
                  right: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  fontSize: "16px",
                  cursor: "pointer",
                  color: theme === "dark" ? "#1e88e5" : "#007bff",
                }}
              >
                👁
              </button>
            </div>
            <button
              onClick={verifyCode}
              style={{
                backgroundColor: theme === "dark" ? "#1e88e5" : "#007bff",
                color: "#fff",
                padding: "10px 20px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px",
                transition: "background-color 0.3s ease, transform 0.3s ease",
                width: "100%",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = theme === "dark" ? "#1565c0" : "#0056b3")}
              onMouseOut={(e) => (e.target.style.backgroundColor = theme === "dark" ? "#1e88e5" : "#007bff")}
            >
              Reset Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForgotPasswordAndVerify;