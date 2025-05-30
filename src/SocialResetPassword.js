import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert";

function SocialResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  // Get token and email from query params
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const email = params.get("email");

  const showAlertMessage = (msg) => {
    setAlertMessage(msg);
    setShowAlert(true);
  };

  const closeAlert = () => {
    setShowAlert(false);
    setAlertMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirm) {
      showAlertMessage("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      showAlertMessage("Passwords do not match.");
      return;
    }
    if (!token || !email) {
      showAlertMessage("Invalid or expired reset link.");
      return;
    }
    setSpinner(true);
    try {
      const res = await fetch("https://socialserver-377n.onrender.com/api/auth/complete-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const json = await res.json();
      setSpinner(false);
      if (res.ok) {
        showAlertMessage(json.message || "Password reset successful. Please login.");
        setTimeout(() => navigate("/slogin"), 2000);
      } else {
        showAlertMessage(json.message || "Unable to reset password.");
      }
    } catch (error) {
      setSpinner(false);
      showAlertMessage("Error: " + error.message);
    }
  };

  return (
    <div style={{
      background: "linear-gradient(to right, #1f4037, #99f2c8)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Poppins', sans-serif"
    }}>
      {showAlert && <StyledAlert message={alertMessage} onClose={closeAlert} />}
      <div style={{
        background: "rgba(255,255,255,0.07)",
        borderRadius: "20px",
        padding: "40px",
        width: "100%",
        maxWidth: "400px",
        color: "#222",
        boxShadow: "0 8px 30px rgba(0,0,0,0.2)"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ position: "relative", marginBottom: "18px" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                paddingRight: "60px"
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                top: "50%",
                right: "12px",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#18ddc9",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div style={{ position: "relative", marginBottom: "18px" }}>
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                paddingRight: "60px"
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: "absolute",
                top: "50%",
                right: "12px",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#18ddc9",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
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
              cursor: "pointer"
            }}
            disabled={spinner}
          >
            {spinner ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SocialResetPassword;
