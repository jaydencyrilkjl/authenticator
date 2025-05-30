import React from "react";
import { useNavigate } from "react-router-dom";

const AdminPortal = () => {
  const navigate = useNavigate();

  const accessDashboard = () => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      // Token exists, redirect to dashboard
      navigate("/admindb");
    } else {
      // No token, send to login
      alert("Please login first.");
      navigate("/admin-login");
    }
  };

  return (
    <div
      style={{
        margin: 0,
        fontFamily: "'Segoe UI', sans-serif",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        color: "white",
        overflowX: "hidden",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          textAlign: "center",
          padding: "20px",
          animation: "fadeInDown 1s ease-out",
        }}
      >
        <h1
          style={{
            fontSize: "2em",
            marginBottom: "10px",
            lineHeight: "1.2",
          }}
        >
          Welcome to TradeSpot Admin Portal
        </h1>
        <p
          style={{
            fontSize: "1em",
            maxWidth: "90%",
            margin: "auto",
            lineHeight: "1.5",
          }}
        >
          Manage investments, users, referrals, and keep the platform running
          smoothly with advanced insights and powerful tools.
        </p>
      </header>

      <div
        className="buttons"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "15px",
          margin: "30px 0",
          animation: "fadeInUp 1.2s ease-out",
        }}
      >
        <button
          onClick={() => navigate("/admin-login")}
          style={{
            padding: "12px 20px",
            fontSize: "1em",
            border: "none",
            borderRadius: "8px",
            background: "linear-gradient(to right, #43e97b, #38f9d7)",
            color: "#000",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            width: "100%",
            maxWidth: "250px",
          }}
        >
          Login
        </button>
        <button
          onClick={() => navigate("/admin-signup")}
          style={{
            padding: "12px 20px",
            fontSize: "1em",
            border: "none",
            borderRadius: "8px",
            background: "linear-gradient(to right, #43e97b, #38f9d7)",
            color: "#000",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            width: "100%",
            maxWidth: "250px",
          }}
        >
          Signup
        </button>
        <button
          onClick={accessDashboard}
          style={{
            padding: "12px 20px",
            fontSize: "1em",
            border: "none",
            borderRadius: "8px",
            background: "linear-gradient(to right, #43e97b, #38f9d7)",
            color: "#000",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            width: "100%",
            maxWidth: "250px",
          }}
        >
          Access Dashboard
        </button>
      </div>

      <div
        className="content"
        style={{
          maxWidth: "100%",
          margin: "auto",
          padding: "20px",
          animation: "fadeIn 2s ease-in-out",
          boxSizing: "border-box",
        }}
      >
        <div
          className="card"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            padding: "20px",
            borderRadius: "10px",
            lineHeight: "1.7",
            fontSize: "1em",
            backdropFilter: "blur(8px)",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "1.5em", marginBottom: "15px" }}>
            Admin Responsibilities
          </h2>
          <p style={{ fontSize: "0.9em", lineHeight: "1.6" }}>
            As a TradeSpot Admin, you're entrusted with overseeing the
            platform’s operations, managing user accounts, handling investment
            validations, monitoring deposits and withdrawals, and ensuring all
            activities are compliant with platform policies. You are the
            backbone of trust and efficiency, maintaining real-time supervision
            of critical data and responding swiftly to any irregularities. Your
            actions directly impact the user experience, so responsibility,
            transparency, and precision are key.
          </p>
        </div>
      </div>

      <style>
        {`
          @media (max-width: 768px) {
            h1 {
              font-size: 1.8em;
            }
            p {
              font-size: 0.9em;
            }
            .buttons {
              flex-direction: column;
              align-items: center;
              gap: 15px;
            }
            .buttons button {
              font-size: 0.9em;
              padding: 10px 15px;
              width: 100%;
              max-width: 300px;
            }
          }

          @media (max-width: 480px) {
            h1 {
              font-size: 1.5em;
            }
            p {
              font-size: 0.8em;
            }
            .buttons {
              flex-direction: column;
              align-items: center;
              gap: 10px;
            }
            .buttons button {
              width: 100%;
              max-width: none;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AdminPortal;