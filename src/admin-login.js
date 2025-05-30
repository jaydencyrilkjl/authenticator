import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert"; // Import StyledAlert

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "https://tradespots.online/api/admin/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();
      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        navigate("/admindb");
      } else {
        showAlertMessage(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Error during admin login:", error);
      showAlertMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        background: "linear-gradient(135deg, #1e3c72, #2a5298)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        animation: "fadeIn 1s ease",
      }}
    >
      {showAlert && <StyledAlert message={alertMessage} onClose={closeAlert} />}
      <div
        style={{
          backdropFilter: "blur(10px)",
          background: "rgba(0, 0, 0, 0.6)",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
          width: "100%",
          maxWidth: "420px",
          color: "#fff",
          transition: "transform 0.3s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "25px",
            fontSize: "28px",
            color: "#00ffff",
          }}
        >
          Admin Login
        </h2>
        <form
          onSubmit={handleLogin}
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
              padding: "12px 14px",
              marginBottom: "18px",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: "#ffffff",
              color: "#000",
              outline: "none",
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
                padding: "12px 14px",
                paddingRight: "45px",
                marginBottom: "18px",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                backgroundColor: "#ffffff",
                color: "#000",
                outline: "none",
              }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: "17px",
                background: "rgba(255, 255, 255, 0.2)",
                padding: "3px 7px",
                borderRadius: "5px",
                color: "#fff",
                transition: "background 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.4)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")
              }
            >
              👁
            </span>
          </div>
          <button
            type="submit"
            style={{
              padding: "12px",
              background: "linear-gradient(90deg, #00b894, #00cec9)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "17px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background 0.3s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background =
                "linear-gradient(90deg, #00cec9, #0984e3)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background =
                "linear-gradient(90deg, #00b894, #00cec9)")
            }
          >
            Login
          </button>
        </form>
        <div
          style={{
            textAlign: "center",
            marginTop: "15px",
            fontSize: "14px",
          }}
        >
          <p>
            Don't have an account?{" "}
            <a
              href="/admin-signup"
              style={{
                color: "#00ffff",
                textDecoration: "none",
                fontWeight: "bold",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.textDecoration = "underline")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.textDecoration = "none")
              }
            >
              Signup here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;