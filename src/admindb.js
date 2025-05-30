import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import StyledAlert from "./components/StyledAlert"; // Import StyledAlert

const AdminDashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [adminUsername, setAdminUsername] = useState("Loading...");
  const [adminReferralCode, setAdminReferralCode] = useState("Loading...");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState(""); // State for alert message
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin-login"); // Redirect if no token
      return;
    }

    // Fetch admin stats
    fetch("https://tradespots.online/api/admin/admin-stats")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setTotalUsers(data.totalUsers);
        setTotalInvestment(data.totalInvestment);
        setTotalWithdrawals(data.totalWithdrawals);
      })
      .catch((error) => console.error("Error fetching data:", error));

    // Fetch admin details
    fetch("https://tradespots.online/api/admin/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((admin) => {
        setAdminUsername(admin.username);
        setAdminReferralCode(admin.referralCode);
      })
      .catch((error) => console.error("Error fetching admin details:", error));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin-login"); // Immediately redirect to admin-login
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#121212", color: "#ffffff", minHeight: "100vh", position: "relative" }}>
      {/* StyledAlert */}
      {alertMessage && (
        <StyledAlert
          message={alertMessage}
          onClose={() => setAlertMessage("")}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          height: "100vh",
          background: "linear-gradient(135deg, #004d00, #b8860b)",
          padding: "20px",
          position: "fixed",
          top: 0,
          left: sidebarVisible ? 0 : "-250px", // Sidebar hidden by default
          boxShadow: "6px 0 15px rgba(0, 77, 0, 0.3)",
          borderRight: "2px solid #b8860b",
          transition: "left 0.3s ease",
          zIndex: 1000,
          textAlign: "center", // Center all sidebar content
          overflowY: "auto", // Make sidebar scrollable
        }}
        onClick={(e) => e.stopPropagation()} // Prevent click from closing sidebar
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px", textShadow: "2px 2px 5px rgba(0, 0, 0, 0.5)" }}>
          Admin Panel
        </h2>
        <Link to="/users" style={linkStyle}>User Management</Link>
        <Link to="/referrals" style={linkStyle}>Referral Tracking</Link>
        <Link to="/investments" style={linkStyle}>Investments</Link>
        <Link to="/withdrawals" style={linkStyle}>Withdrawals</Link>
        <Link to="/deposits" style={linkStyle}>Deposits</Link>
        <Link to="/notifications" style={linkStyle}>Notification</Link>
        <Link to="/adsocial" style={linkStyle}>Social Hub</Link> {/* Updated to lead to Adsocial.js */}
        <Link to="/admin-contact" style={linkStyle}>Messages</Link>
        <Link to="/store" style={linkStyle}>Store</Link>
        <button onClick={handleLogout} style={{ ...linkStyle, border: "none", cursor: "pointer", width: "100%" }}>Logout</button>
      </div>

      {/* Overlay for closing sidebar when clicking outside */}
      {sidebarVisible && (
        <div
          onClick={() => setSidebarVisible(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.01)",
            zIndex: 999,
          }}
        />
      )}

      {/* Main Content */}
      <div style={{ padding: "20px", textAlign: "center" }}>
        <button
          onClick={() => setSidebarVisible(!sidebarVisible)}
          style={{
            position: "fixed",
            top: "10px",
            left: "10px",
            background: "rgba(255, 255, 255, 0.1)",
            color: "rgba(255, 255, 255, 0.6)",
            border: "none",
            padding: "10px",
            borderRadius: "5px",
            cursor: "pointer",
            transition: "background 0.3s ease, color 0.3s ease",
            zIndex: 1100,
          }}
        >
          ☰
        </button>
        <div
          style={{
            background: "linear-gradient(135deg, #004d00, #b8860b)",
            padding: "15px",
            textAlign: "center",
            fontSize: "1.8em",
            fontWeight: "bold",
            borderBottom: "3px solid #b8860b",
            borderRadius: "8px",
            boxShadow: "0px 5px 10px rgba(0, 77, 0, 0.3)",
          }}
        >
          Admin Dashboard
        </div>
        <p
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            padding: "15px",
            borderRadius: "10px",
            boxShadow: "2px 2px 10px rgba(255, 255, 255, 0.2)",
            display: "inline-block",
            textAlign: "center",
          }}
        >
          Welcome to the TradeSpot Admin Dashboard. Manage users, investments, and transactions here.
        </p>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Total Users</th>
              <th style={thStyle}>Total Investment (SPOT)</th>
              <th style={thStyle}>Total Withdrawals ($)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>{totalUsers}</td>
              <td style={tdStyle}>{totalInvestment}</td>
              <td style={tdStyle}>${totalWithdrawals}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ ...tableStyle, marginTop: "20px" }}>
          <thead>
            <tr>
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Referral Code</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>{adminUsername}</td>
              <td style={tdStyle}>{adminReferralCode}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const linkStyle = {
  display: "block",
  color: "#ffffff",
  textDecoration: "none",
  padding: "12px",
  margin: "8px 0",
  borderRadius: "8px",
  background: "rgba(255, 255, 255, 0.1)",
  transition: "0.3s ease",
  textAlign: "center", // Center text in sidebar links
};

const tableStyle = {
  width: "100%",
  marginTop: "20px",
  borderCollapse: "collapse",
};

const thStyle = {
  border: "1px solid #b8860b",
  padding: "10px",
  textAlign: "center",
  background: "linear-gradient(135deg, #004d00, #b8860b)",
};

const tdStyle = {
  border: "1px solid #b8860b",
  padding: "10px",
  textAlign: "center",
};

export default AdminDashboard;
