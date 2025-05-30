import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert";
import { ThemeContext } from "./App"; // Import ThemeContext

const TeamMembers = () => {
  const [referralLink, setReferralLink] = useState("");
  const [totalMembers, setTotalMembers] = useState(0);
  const [investedMembers, setInvestedMembers] = useState(0);
  const [teamMembers, setTeamMembers] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState(null);
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext); // Use theme context

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");

    if (!authToken || !userId) {
      setAlertMessage("User not logged in!");
      setAlertCallback(() => () => navigate("/login"));
      return;
    }

    const fetchTeamData = async () => {
      try {
        const userResponse = await fetch(
          `https://tradespots.online/api/auth/user/${userId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        const userData = await userResponse.json();
        setReferralLink(`https://tradespot.online/signup?referralCode=${userData.user.referralCode}`); // <-- fix here

        const teamResponse = await fetch(
          `https://tradespots.online/api/team/${userId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        const teamData = await teamResponse.json();

        if (teamResponse.ok) {
          setTotalMembers(teamData.totalTeamMembers);
          setInvestedMembers(teamData.investedTeamMembers);
          setTeamMembers(teamData.teamMembers);
        } else {
          setAlertMessage(teamData.message || "Error fetching team data");
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
        setAlertMessage("Failed to load team members.");
      }
    };

    fetchTeamData();
  }, [navigate]);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setAlertMessage("Copied!");
    });
  };

  // Define colors based on theme
  const isDark = theme === "dark";
  const bgColor = isDark ? "#121212" : "#f2f4f8";
  const cardBg = isDark ? "#333" : "#fff";
  const cardShadow = isDark
    ? "0 8px 20px rgba(255,255,255,0.15)"
    : "0 8px 20px rgba(0,0,0,0.15)";
  const borderColor = "#007bff";
  const textColor = isDark ? "#f1f1f1" : "#333";
  const subTextColor = isDark ? "#ccc" : "#555";
  const tableHeaderBg = isDark ? "#222" : "#f9f9f9";
  const tableHeaderColor = isDark ? "#f1f1f1" : "#333";
  const tableRowColor = isDark ? "#ccc" : "#555";
  const inputBg = isDark ? "#222" : "#fff";
  const inputBorder = isDark ? "#444" : "#ccc";

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        backgroundColor: bgColor,
        color: textColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
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
          position: "fixed",
          top: "30px",
          left: "10px",
          fontSize: "10px",
          backgroundColor: borderColor,
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          padding: "8px 14px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
          transition: "background-color 0.3s ease, transform 0.3s ease",
        }}
      >
        🔙 Back
      </button>
      
      <div
        style={{
          background: cardBg,
          color: textColor,
          padding: "30px 25px",
          borderRadius: "12px",
          maxWidth: "600px",
          width: "100%",
          boxShadow: cardShadow,
          borderTop: `4px solid ${borderColor}`,
          transition: "box-shadow 0.3s ease-in-out",
        }}
      >
        <h1
          style={{
            color: textColor,
            marginBottom: "20px",
            fontSize: "32px",
            borderBottom: `2px solid ${borderColor}`,
            paddingBottom: "10px",
            textAlign: "center",
          }}
        >
          Team Members
        </h1>
        <div
          style={{
            background: tableHeaderBg,
            padding: "12px 15px",
            marginBottom: "15px",
            borderLeft: `4px solid ${borderColor}`,
            borderRadius: "4px",
            color: subTextColor,
            fontSize: "16px",
          }}
        >
          <label style={{ fontWeight: "bold", color: textColor }}>Your Referral Link:</label>
          <input
            type="text"
            value={referralLink}
            readOnly
            style={{
              width: "calc(100% - 70px)",
              padding: "8px",
              border: `1px solid ${inputBorder}`,
              borderRadius: "4px",
              marginRight: "5px",
              fontSize: "16px",
              background: inputBg,
              color: textColor,
            }}
          />
          <button
            onClick={copyReferralLink}
            style={{
              padding: "8px 12px",
              border: "none",
              backgroundColor: borderColor,
              color: "#fff",
              cursor: "pointer",
              borderRadius: "4px",
              fontSize: "16px",
              transition: "background-color 0.3s ease, transform 0.3s ease",
            }}
          >
            Copy
          </button>
        </div>
        <div
          style={{
            background: tableHeaderBg,
            padding: "12px 15px",
            marginBottom: "15px",
            borderLeft: `4px solid ${borderColor}`,
            borderRadius: "4px",
            color: subTextColor,
            fontSize: "16px",
          }}
        >
          <strong style={{ color: textColor }}>Total Members:</strong> <span>{totalMembers}</span>
        </div>
        <div
          style={{
            background: tableHeaderBg,
            padding: "12px 15px",
            marginBottom: "15px",
            borderLeft: `4px solid ${borderColor}`,
            borderRadius: "4px",
            color: subTextColor,
            fontSize: "16px",
          }}
        >
          <strong style={{ color: textColor }}>Invested Members:</strong> <span>{investedMembers}</span>
        </div>
        <div style={{ marginTop: "20px", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: cardBg,
              fontSize: "16px",
              color: textColor,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${inputBorder}`,
                    background: tableHeaderBg,
                    color: tableHeaderColor,
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${inputBorder}`,
                    background: tableHeaderBg,
                    color: tableHeaderColor,
                  }}
                >
                  Date Joined
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${inputBorder}`,
                    background: tableHeaderBg,
                    color: tableHeaderColor,
                  }}
                >
                  Invested
                </th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.length > 0 ? (
                teamMembers.map((member, index) => (
                  <tr key={index}>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        borderBottom: `1px solid ${inputBorder}`,
                        color: tableRowColor,
                      }}
                    >
                      {member.email}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        borderBottom: `1px solid ${inputBorder}`,
                        color: tableRowColor,
                      }}
                    >
                      {member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        borderBottom: `1px solid ${inputBorder}`,
                        color: tableRowColor,
                      }}
                    >
                      {member.invested === "invested" ? "✅" : "❌"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: tableRowColor,
                    }}
                  >
                    No Team Members Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamMembers;