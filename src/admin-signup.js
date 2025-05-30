import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert"; // Import StyledAlert

const AdminSignup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState(""); // State for alert message
  const [showAlert, setShowAlert] = useState(false); // State to show/hide alert
  const navigate = useNavigate();

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const closeAlert = () => {
    setShowAlert(false);
    setAlertMessage("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "https://tradespots.online/api/admin/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, referralCode }),
        }
      );

      const data = await response.json();
      if (data.success) {
        showAlertMessage("Admin registered successfully!");
        navigate("/admin-login");
      } else {
        showAlertMessage(data.error || "Signup failed");
      }
    } catch (error) {
      console.error("Error during admin signup:", error);
      showAlertMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        margin: 0,
        padding: 0,
        background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {showAlert && <StyledAlert message={alertMessage} onClose={closeAlert} />}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "15px",
          padding: "40px",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          width: "100%",
          maxWidth: "420px",
          animation: "fadeIn 1s ease-in-out",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "25px",
            fontSize: "28px",
            color: "#00ffcc",
            textShadow: "1px 1px 2px #000",
          }}
        >
          Admin Signup
        </h2>
        <form
          onSubmit={handleSignup}
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              padding: "12px 15px",
              marginBottom: "20px",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              background: "rgba(255, 255, 255, 0.1)",
              color: "#fff",
              transition: "all 0.3s ease",
            }}
          />
          <div
            style={{
              position: "relative",
            }}
          >
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: "12px 15px",
                paddingRight: "45px",
                marginBottom: "20px",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                transition: "all 0.3s ease",
              }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: "18px",
                background: "rgba(0, 0, 0, 0.3)",
                padding: "4px 6px",
                borderRadius: "5px",
              }}
            >
              👁
            </span>
          </div>
          <input
            type="text"
            placeholder="Referral Code"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            required
            style={{
              padding: "12px 15px",
              marginBottom: "20px",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              background: "rgba(255, 255, 255, 0.1)",
              color: "#fff",
              transition: "all 0.3s ease",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "12px",
              background: "linear-gradient(135deg, #00ffcc, #007fff)",
              border: "none",
              borderRadius: "8px",
              color: "#000",
              fontWeight: "bold",
              fontSize: "17px",
              cursor: "pointer",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 0 10px #00ffcc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Sign Up
          </button>
        </form>
        <div
          style={{
            textAlign: "center",
            marginTop: "15px",
          }}
        >
          <p>
            Already have an account?{" "}
            <a
              href="/admin-login"
              style={{
                color: "#00ffcc",
                textDecoration: "none",
                fontWeight: "bold",
                transition: "text-shadow 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.textShadow = "0 0 8px #00ffcc")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.textShadow = "none")
              }
            >
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;