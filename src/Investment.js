import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert";
import { ThemeContext } from "./App";

const InvestmentPlans = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [investmentHistory, setInvestmentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState(null);
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setAlertMessage("User not logged in!");
      setAlertCallback(() => () => navigate("login.html"));
    }
  }, [navigate]);

  const fetchInvestmentHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      const response = await fetch(
        `https://tradespots.online/api/investments/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch investments");
      const investmentsData = await response.json();
      const investments = Array.isArray(investmentsData)
        ? investmentsData
        : investmentsData.investments || [];
      const historyInvestments = investments.filter(
        (investment) =>
          investment.status === "completed" || investment.status === "cancelled"
      );
      setInvestmentHistory(historyInvestments);
    } catch (error) {
      console.error("Error fetching investment history:", error);
      setAlertMessage("Failed to load investment history.");
    } finally {
      setLoading(false);
    }
  };

  const invest = async (plan) => {
    const userId = localStorage.getItem("userId");
    const authToken = localStorage.getItem("authToken");
    if (!userId || !authToken) {
      setAlertMessage("You are not logged in!");
      setAlertCallback(() => () => (window.location.href = "login.html"));
      return;
    }
    try {
      const response = await fetch(
        "https://tradespots.online/api/investments/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ userId, plan }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Investment failed");
      setAlertMessage(`Investment successful: ${plan}`);
    } catch (error) {
      setAlertMessage("Error: " + error.message);
    }
  };

  const plans = {
    TS1: { amount: 0.1, dailyEarnings: 0.1 * 0.058 },
    TS2: { amount: 0.2, dailyEarnings: 0.2 * 0.058 },
    TS3: { amount: 0.7, dailyEarnings: 0.7 * 0.058 },
    TS4: { amount: 1, dailyEarnings: 1 * 0.058 },
    TS5: { amount: 2, dailyEarnings: 2 * 0.062 },
    TS6: { amount: 5.4, dailyEarnings: 5.4 * 0.062 },
    TS7: { amount: 11, dailyEarnings: 11 * 0.062 },
    TS8: { amount: 20, dailyEarnings: 20 * 0.062 },
    TS9: { amount: 28, dailyEarnings: 28 * 0.065 },
    TSX: { amount: 40, dailyEarnings: 40 * 0.065 },
  };

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        backgroundColor: theme === "dark" ? "#121212" : "#f2f4f8",
        color: theme === "dark" ? "#f1f1f1" : "#333",
        padding: "20px",
        minHeight: "100vh",
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
        onClick={() => navigate("/dashboard")}
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
          boxShadow:
            theme === "dark"
              ? "0 4px 6px rgba(255,255,255,0.15)"
              : "0 4px 6px rgba(0, 0, 0, 0.2)",
          transition: "background-color 0.3s ease, transform 0.3s ease",
        }}
      >
        🔙 Back
      </button>
      <button
        onClick={() => {
          fetchInvestmentHistory();
          setModalVisible(true);
        }}
        style={{
          position: "absolute",
          top: "30px",
          right: "10px",
          fontSize: "10px",
          backgroundColor: theme === "dark" ? "#1e88e5" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          padding: "8px 14px",
          boxShadow:
            theme === "dark"
              ? "0 4px 6px rgba(255,255,255,0.15)"
              : "0 4px 6px rgba(0, 0, 0, 0.2)",
          transition: "background-color 0.3s ease, transform 0.3s ease",
        }}
      >
        📜 History
      </button>
      <div
        style={{
          background: theme === "dark" ? "#333" : "#fff",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "900px",
          margin: "0 auto",
          boxShadow:
            theme === "dark"
              ? "0 8px 20px rgba(255,255,255,0.15)"
              : "0 8px 20px rgba(0, 0, 0, 0.15)",
          borderTop: `4px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
        }}
      >
        <h1
          style={{
            marginBottom: "20px",
            color: theme === "dark" ? "#f1f1f1" : "#333",
            fontSize: "22px",
            textAlign: "center",
            borderBottom: `2px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
            paddingBottom: "10px",
          }}
        >
          TRADESPOT INVESTMENT PLANS
        </h1>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {Object.keys(plans).map((planKey) => {
            const { amount, dailyEarnings } = plans[planKey];
            return (
              <div
                key={planKey}
                style={{
                  background: theme === "dark" ? "#232323" : "#fff",
                  padding: "20px",
                  borderRadius: "10px",
                  border: theme === "dark" ? "1px solid #444" : "1px solid #e0e0e0",
                  boxShadow:
                    theme === "dark"
                      ? "0 2px 8px rgba(255,255,255,0.07)"
                      : "0 2px 8px rgba(0,0,0,0.1)",
                  width: "280px",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                <h3 style={{ marginTop: "0", color: theme === "dark" ? "#1e88e5" : "#007bff" }}>
                  {planKey}
                </h3>
                <p style={{ margin: "10px 0", color: theme === "dark" ? "#bbb" : "#555" }}>
                  {amount} SPOT → Earn {Number(dailyEarnings.toPrecision(6)).toString()} SPOT daily for 30 days
                </p>
                <button
                  onClick={() => invest(planKey)}
                  style={{
                    backgroundColor: theme === "dark" ? "#1e88e5" : "#007bff",
                    color: "#fff",
                    padding: "10px 15px",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    transition: "background-color 0.3s ease, transform 0.3s ease",
                  }}
                >
                  Invest Now
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {modalVisible && (
        <div
          style={{
            display: "flex",
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            zIndex: "1000",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: theme === "dark" ? "#232323" : "#fff",
              color: theme === "dark" ? "#f1f1f1" : "#333",
              padding: "20px",
              borderRadius: "10px",
              maxWidth: "600px",
              maxHeight: "80%",
              overflowY: "auto",
              borderTop: `4px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
              boxShadow:
                theme === "dark"
                  ? "0 8px 20px rgba(255,255,255,0.15)"
                  : "0 8px 20px rgba(0, 0, 0, 0.15)",
            }}
          >
            <h2 style={{ margin: "0 0 10px", color: theme === "dark" ? "#1e88e5" : "#007bff" }}>
              Investment History
            </h2>
            <div>
              {loading ? (
                <p>Loading...</p>
              ) : investmentHistory.length > 0 ? (
                investmentHistory.map((investment, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "10px",
                      padding: "10px",
                      background: theme === "dark" ? "#181818" : "#f9f9f9",
                      borderLeft: `4px solid ${theme === "dark" ? "#1e88e5" : "#007bff"}`,
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: theme === "dark" ? "#f1f1f1" : "#333",
                    }}
                  >
                    <p>
                      <strong>Plan:</strong> {investment.plan}
                    </p>
                    <p>
                      <strong>Amount:</strong> {investment.amount} SPOT
                    </p>
                    <p>
                      <strong>Status:</strong> {investment.status}
                    </p>
                    <p>
                      <strong>End Date:</strong>{" "}
                      {new Date(investment.endDate).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", fontSize: "14px" }}>
                  No completed or cancelled investments.
                </p>
              )}
            </div>
            <button
              onClick={() => setModalVisible(false)}
              style={{
                backgroundColor: theme === "dark" ? "#1e88e5" : "#007bff",
                color: "#fff",
                padding: "8px 12px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "transform 0.3s ease",
                marginTop: "15px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentPlans;