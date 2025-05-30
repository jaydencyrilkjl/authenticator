import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert";
import { ThemeContext } from "./App";

function Dashboard() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome,...");
  const [notification, setNotification] = useState("");
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState(null);
  const [utcTime, setUtcTime] = useState("");
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setAlertMessage("User not logged in!");
      setAlertCallback(() => () => navigate("/login"));
      return;
    }

    const fetchDashboardData = async () => {
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
            throw new Error("Failed to fetch user data");
          }
        }

        const user = await response.json();
        if (user.user && user.user.fullName) {
          setWelcomeMessage(`Welcome, ${user.user.fullName}`);
          localStorage.setItem("userName", user.user.fullName);
        }

        const notificationMessage = localStorage.getItem("platformNotification");
        if (notificationMessage) {
          setNotification(notificationMessage);
          setShowNotificationModal(true);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setAlertMessage("Error loading dashboard. Please try again.");
        setAlertCallback(() => () => navigate("/login"));
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Add effect to handle session expired message from API or other sources
  useEffect(() => {
    if (alertMessage === "Session expired or logged in on another device.") {
      setAlertCallback(() => () => {
        localStorage.removeItem("authToken");
        navigate("/login");
      });
    }
  }, [alertMessage, navigate]);

  useEffect(() => {
    // Initialize TradingView widget
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;  
    script.onload = () => {
      new window.TradingView.widget({
        container_id: "cryptoChartContainer",
        width: "100%",
        height: "400",
        symbol: "BINANCE:BTCUSDT",
        interval: "D",
        timezone: "Etc/UTC",
        theme: theme === "dark" ? "dark" : "light",
        style: "1",
        locale: "en",
        toolbar_bg: theme === "dark" ? "#232323" : "#ffffff",
        enable_publishing: false,
        withdateranges: true,
        hide_side_toolbar: false,
        allow_symbol_change: true,
      });
    };
    document.body.appendChild(script);
    // Clean up
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
    // eslint-disable-next-line
  }, [theme]);

  // Fetch live UTC time from backend and update every second
  useEffect(() => {
    let intervalId;
    const fetchUtcTime = async () => {
      try {
        const response = await fetch("https://tradespots.online/api/contact/utc-time");
        const data = await response.json();
        setUtcTime(data.utc);
      } catch (err) {
        setUtcTime("Error fetching UTC time");
      }
    };
    fetchUtcTime();
    intervalId = setInterval(fetchUtcTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  // Theme-based colors (match Settings.js)
  const colors = {
    background: theme === "dark" ? "#121212" : "#f2f4f8",
    sidebarBg: theme === "dark" ? "#232323" : "#ffffff",
    sidebarBorder: theme === "dark" ? "#1e88e5" : "#4fc3f7",
    sidebarText: theme === "dark" ? "#f1f1f1" : "#0d47a1",
    sidebarShadow: theme === "dark"
      ? "4px 4px 8px rgba(30,136,229,0.15)"
      : "4px 4px 8px rgba(0, 0, 0, 0.2)",
    sidebarItemBg: theme === "dark"
      ? "linear-gradient(145deg, #232323, #333)"
      : "linear-gradient(145deg, #e3f2fd, #bbdefb)",
    sidebarItemBorder: theme === "dark" ? "#1e88e5" : "#4fc3f7",
    sidebarItemText: theme === "dark" ? "#f1f1f1" : "#0d47a1",
    mainText: theme === "dark" ? "#f1f1f1" : "#0d47a1",
    mainBg: theme === "dark"
      ? "linear-gradient(135deg, #232323, #121212)"
      : "linear-gradient(135deg, #4fc3f7, #e1f5fe)",
    cardBg: theme === "dark"
      ? "linear-gradient(145deg, #232323, #333)"
      : "linear-gradient(145deg, #4fc3f7, #03a9f4)",
    cardText: theme === "dark" ? "#fff" : "#0d47a1",
    cardShadow: theme === "dark"
      ? "0 0 10px rgba(30,136,229,0.2), 0 0 30px rgba(30,136,229,0.1)"
      : "0 0 10px rgba(0, 0, 0, 0.2), 0 0 30px rgba(0, 0, 0, 0.1)",
    toggleBtnBg: theme === "dark" ? "#333" : "#eee",
    toggleBtnText: theme === "dark" ? "#fff" : "#333",
    accent: theme === "dark" ? "#1e88e5" : "#4fc3f7",
    modalBg: theme === "dark"
      ? "linear-gradient(145deg, #232323, #333)"
      : "linear-gradient(145deg, #ffffff, #e0f7fa)",
    modalText: theme === "dark" ? "#f1f1f1" : "#0d47a1",
    modalBorder: theme === "dark" ? "#1e88e5" : "#4fc3f7",
    overlay: "rgba(0, 0, 0, 0.7)",
  };

  return (
    <div
      style={{
        margin: 0,
        fontFamily: "'Segoe UI', sans-serif",
        display: "flex",
        height: "100vh",
        background: colors.mainBg,
        color: colors.mainText,
        perspective: "1200px",
        transition: "background 0.3s, color 0.3s",
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

      {/* Sidebar */}
      <div
        id="sidebar"
        style={{
          width: "250px",
          background: colors.sidebarBg,
          position: "fixed",
          height: "100vh",
          paddingTop: "20px",
          transform: sidebarVisible ? "translateX(0)" : "translateX(-260px)",
          transition: "transform 0.3s ease, background 0.3s",
          borderRight: `2px solid ${colors.sidebarBorder}`,
          zIndex: 1000,
          overflowY: "auto",
          boxShadow: colors.sidebarShadow,
        }}
      >
        <h3
          style={{
            textAlign: "center",
            marginBottom: "20px",
            fontSize: "26px",
            color: colors.sidebarText,
            fontWeight: "900",
            letterSpacing: "1px",
            textShadow: theme === "dark"
              ? "2px 2px 4px #1e88e5"
              : "2px 2px 4px rgba(0, 0, 0, 0.2)",
          }}
        >
          TradeSpot
        </h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {[{ label: "👤 Profile", link: "/profile" },
            { label: "👥 Team", link: "/team" },
            { label: "💵 Funds", link: "/funds" },
              { label: "💰 Market", link: "/investment" },
            { label: "📞 Contact", link: "/contact" },
            { label: "⚙️ Settings", link: "/settings" },
            { label: "💬 Social Hub", link: "/Slogin" },
          ].map((item, index) => (
            <li
              key={index}
              style={{
                margin: "10px 15px",
                background: colors.sidebarItemBg,
                border: `2px solid ${colors.sidebarItemBorder}`,
                borderRadius: "8px",
                boxShadow: colors.sidebarShadow,
                padding: "15px 20px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              <a
                href={item.link}
                style={{
                  color: colors.sidebarItemText,
                  textDecoration: "none",
                  fontSize: "16px",
                  textShadow: theme === "dark"
                    ? "1px 1px 2px #1e88e5"
                    : "1px 1px 2px rgba(0, 0, 0, 0.1)",
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
          <li
            onClick={handleLogout}
            style={{
              margin: "10px 15px",
              background: colors.sidebarItemBg,
              border: `2px solid ${colors.sidebarItemBorder}`,
              borderRadius: "8px",
              boxShadow: colors.sidebarShadow,
              padding: "15px 20px",
              fontWeight: "bold",
              textAlign: "center",
              cursor: "pointer",
              color: colors.sidebarItemText,
            }}
          >
            🚪 Logout
          </li>
        </ul>
      </div>

      {/* Overlay */}
      {sidebarVisible && (
        <div
          id="overlay"
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.2)",
            zIndex: 500,
          }}
        ></div>
      )}

      {/* Main Content */}
      <div
        id="mainContent"
        style={{
          flex: 1,
          width: "100%",
          padding: "20px",
          textAlign: "center",
          position: "relative",
          transition: "filter 0.3s",
        }}
      >
        <button
          id="menuBtn"
          onClick={toggleSidebar}
          style={{
            position: "absolute",
            top: "15px",
            left: "15px",
            fontSize: "12px",
            background: colors.accent,
            border: "none",
            borderRadius: "50%",
            width: "30px",
            height: "30px",
            cursor: "pointer",
            color: "#ffffff",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 8px rgba(0, 0, 0, 0.2)",
          }}
        >
          ☰
        </button>
        <h1
          id="welcomeMessage"
          style={{
            // Apply the same text style as the profile name header, but keep the Dashboard color
            color: colors.cardText,
            marginBottom: "10px",
            fontSize: "15px",
            borderBottom: `2px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
            paddingBottom: "6px",
            fontWeight: 900,
            fontFamily: "'Arial Black', 'Segoe UI', 'Arial', 'Montserrat', 'Roboto', sans-serif",
            letterSpacing: "1px",
            textTransform: "uppercase",
            textShadow: "none",
            WebkitBackgroundClip: "initial",
            WebkitTextFillColor: "initial",
            display: "inline-block",
            // Retain Dashboard-specific styles
            background: colors.cardBg,
            padding: "20px 30px",
            borderRadius: "12px",
            boxShadow: colors.cardShadow,
            transformStyle: "preserve-3d",
            animation: "floatPulse 4s ease-in-out infinite",
            marginTop: "10px",
          }}
        >
          {welcomeMessage}
        </h1>
        {notification && showNotificationModal && (
          <>
            {/* Overlay to darken and disable the entire dashboard */}
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: colors.overlay,
                zIndex: 2999,
                pointerEvents: "none",
              }}
            ></div>
            {/* Notification Modal */}
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: colors.modalBg,
                color: colors.modalText,
                padding: "20px",
                borderRadius: "16px",
                border: `2px solid ${colors.modalBorder}`,
                boxShadow: "10px 20px 40px rgba(30,136,229,0.2)",
                zIndex: 3000,
                width: "80%",
                maxWidth: "300px",
                maxHeight: "300px",
                textAlign: "center",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  lineHeight: "1.4",
                  fontSize: notification.length > 100 ? "14px" : notification.length > 50 ? "16px" : "18px",
                  overflowWrap: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                {notification}
              </div>
              <button
                onClick={() => setShowNotificationModal(false)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "12px",
                  background: "transparent",
                  color: colors.modalText,
                  border: "none",
                  fontSize: "20px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                X
              </button>
            </div>
          </>
        )}
        <div
          id="cryptoChartContainer"
          style={{
            width: "100%",
            maxWidth: "600px",
            height: "400px",
            margin: "20px auto",
            background: theme === "dark" ? "#232323" : "#fff",
            borderRadius: "12px",
            boxShadow: theme === "dark"
              ? "0 8px 20px rgba(30,136,229,0.15)"
              : "0 8px 20px rgba(0,0,0,0.15)",
          }}
        ></div>
        {/* Live UTC Time below the market chart */}
        <div
          style={{
            margin: "16px auto 0 auto",
            color: colors.mainText,
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            display: "inline-block",
          }}
        >
          <span role="img" aria-label="clock" style={{marginRight: 8}}>🕒</span>
          TradeSpot System Time: {utcTime ? utcTime.replace("T", " ").replace(".000Z", " UTC") : "Loading..."}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;