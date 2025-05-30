import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert"; // Import StyledAlert

function Sregister() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState(""); // State for alert message
  const [showAlert, setShowAlert] = useState(false); // State to show/hide alert
  const navigate = useNavigate();

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

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const closeAlert = () => {
    setShowAlert(false);
    setAlertMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://socialserver-377n.onrender.com/api/auth/social-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }), // removed spotId
      });
      if (res.ok) {
        showAlertMessage("Signup successful");
        setTimeout(() => navigate("/slogin"), 2000); // Redirect after 2 seconds
      } else {
        const json = await res.json();
        showAlertMessage("Error: " + json.message);
      }
    } catch (error) {
      showAlertMessage("Error: " + error.message);
    }
  };

  return (
    <div style={bodyStyle}>
      {/* StyledAlert */}
      {showAlert && <StyledAlert message={alertMessage} onClose={closeAlert} />}
      <div style={cardStyle}>
        <h2 style={h2Style}>TradeSpot Socials</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={inputStyle}
          />
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
            Sign Up
          </button>
        </form>
        <div style={linkStyle}>
          Already have an account?{" "}
          <button
            onClick={() => navigate("/Slogin")}
            style={linkAnchorStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#00cec9")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#00b894")}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sregister;
