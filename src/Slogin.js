import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import StyledAlert from "./components/StyledAlert"; // Import StyledAlert

function Slogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState(""); // State for alert message
  const [showAlert, setShowAlert] = useState(false); // State to show/hide alert
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSpinner, setResetSpinner] = useState(false);
  const navigate = useNavigate(); // Define navigate

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const closeAlert = () => {
    setShowAlert(false);
    setAlertMessage("");
  };

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(15px)",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
    color: "white",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.2)",
  };

  const bodyStyle = {
    background: "linear-gradient(to right, #1f4037, #99f2c8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    padding: "20px",
    fontFamily: "'Poppins', sans-serif",
  };

  const h2Style = {
    marginBottom: "20px",
    fontSize: "28px",
    textAlign: "center",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    marginBottom: "20px",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
  };

  const passwordContainerStyle = {
    position: "relative",
  };

  const togglePasswordStyle = {
    position: "absolute",
    top: "36%",
    right: "12px",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#18ddc9",
    fontSize: "14px",
    cursor: "pointer",
  };

  const buttonStyle = {
    width: "100%",
    padding: "12px",
    backgroundColor: "#00b894",
    border: "none",
    borderRadius: "10px",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background 0.3s ease",
  };

  const buttonHoverStyle = {
    backgroundColor: "#00cec9",
  };

  const linkStyle = {
    marginTop: "15px",
    textAlign: "center",
    fontSize: "14px",
    color: "#e0f7fa",
  };

  const linkAnchorStyle = {
    backgroundColor: "#00b894",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: "3px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    border: "none",
    transition: "background-color 0.3s ease",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://socialserver-377n.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (res.ok) {
        localStorage.setItem("userId", json.userId);
        localStorage.removeItem("viewProfileId");
        window.location.href = "/sdb"; // Redirect to Sdb.js
      } else {
        showAlertMessage("Error: " + json.message); // Set alert message
      }
    } catch (error) {
      showAlertMessage("Error: " + error.message); // Set alert message
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      showAlertMessage("Please enter your email.");
      return;
    }
    setResetSpinner(true);
    try {
      const res = await fetch("https://socialserver-377n.onrender.com/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const json = await res.json();
      setResetSpinner(false);
      if (res.ok) {
        showAlertMessage(json.message || "Password reset instructions sent to your email.");
        setShowResetModal(false);
        setResetEmail("");
      } else {
        showAlertMessage("Error: " + (json.message || "Unable to reset password."));
      }
    } catch (error) {
      setResetSpinner(false);
      showAlertMessage("Error: " + error.message);
    }
  };

  return (
    <div style={bodyStyle}>
      {showAlert && <StyledAlert message={alertMessage} onClose={closeAlert} />}
      {/* Reset Password Modal */}
      {showResetModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResetModal(false);
          }}
        >
          <div
            style={{
              background: "#222",
              color: "#fff",
              padding: "30px 20px",
              borderRadius: "12px",
              minWidth: "300px",
              maxWidth: "90vw",
              boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowResetModal(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 14,
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 22,
                cursor: "pointer",
              }}
            >
              &times;
            </button>
            <h3 style={{ marginBottom: 18, textAlign: "center" }}>Reset Password</h3>
            <form onSubmit={handleResetPassword}>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "18px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                }}
              />
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#00b894",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  fontSize: "16px",
                  cursor: "pointer",
                  marginBottom: "10px",
                }}
                disabled={resetSpinner}
              >
                {resetSpinner ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      )}
      <div style={cardStyle}>
        <h2 style={h2Style}>TradeSpot Socials</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <div style={passwordContainerStyle}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ ...inputStyle, paddingRight: "60px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={togglePasswordStyle}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button
            type="submit"
            style={buttonStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = buttonHoverStyle.backgroundColor)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = buttonStyle.backgroundColor)}
          >
            Login
          </button>
        </form>
        <div style={linkStyle}>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            style={{
              ...linkAnchorStyle,
              backgroundColor: "#636e72",
              marginBottom: "10px",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#b2bec3")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#636e72")}
          >
            Forgot Password?
          </button>
        </div>
        <div style={linkStyle}>
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/Sregister")}
            style={linkAnchorStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#00cec9")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#00b894")}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

export default Slogin;
