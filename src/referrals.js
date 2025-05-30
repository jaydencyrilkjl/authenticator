import React, { useEffect, useState } from "react";
import StyledAlert from "./components/StyledAlert"; // Import StyledAlert

const ReferralManagement = () => {
  const [referrals, setReferrals] = useState([]);
  const [teamEmails, setTeamEmails] = useState([]);
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState(""); // State for alert message
  const [alertCallback, setAlertCallback] = useState(null); // Callback for alert actions
  const [searchEmail, setSearchEmail] = useState(""); // Add search state

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const response = await fetch("https://tradespots.online/api/admin/referrals");
      const data = await response.json();
      setReferrals(data);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      setAlertMessage("Error loading referrals. Please try again."); // Set alert message
    }
  };

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) {
      fetchReferrals();
    } else {
      // Filter client-side for the searched email (case-insensitive)
      setReferrals((prev) =>
        Array.isArray(prev)
          ? prev.filter(
              (ref) =>
                ref.email &&
                ref.email.toLowerCase() === searchEmail.trim().toLowerCase()
            )
          : []
      );
    }
  };

  const viewTeam = (emails) => {
    setTeamEmails(emails);
    setTeamModalVisible(true);
  };

  const closeTeamModal = () => {
    setTeamModalVisible(false);
    setTeamEmails([]);
  };

  return (
    <div style={styles.body}>
      {/* StyledAlert */}
      {alertMessage && (
        <StyledAlert
          message={alertMessage}
          onClose={() => {
            setAlertMessage(""); // Clear alert
            setAlertCallback(null);
          }}
          onConfirm={alertCallback} // Execute callback if confirmed
        />
      )}

      <button onClick={() => window.history.back()} style={styles.backBtn}>← Back</button>
      <div style={styles.header}>Referral Management</div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ margin: "20px auto", maxWidth: 400, display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Search by Email..."
          value={searchEmail}
          onChange={e => setSearchEmail(e.target.value)}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "5px",
            border: "1px solid #b8860b",
            outline: "none",
            fontSize: "14px",
            background: "#181818",
            color: "#fff"
          }}
        />
        <button
          type="submit"
          style={{
            background: "#b8860b",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Search
        </button>
      </form>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User Email</th>
              <th style={styles.th}>Team Size</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr>
                <td colSpan="3" style={styles.td}>
                  {searchEmail.trim()
                    ? "Email not found"
                    : "Loading referrals..."}
                </td>
              </tr>
            ) : (
              referrals.map((user, index) => (
                <tr key={index}>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>{user.teamSize}</td>
                  <td style={styles.td}>
                    <button
                      style={styles.viewTeamBtn}
                      onClick={() => viewTeam(user.teamEmails || [])}
                    >
                      View Team
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Team Modal */}
      {teamModalVisible && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && closeTeamModal()}>
          <div style={styles.modalContent}>
            <button style={styles.closeModalBtn} onClick={closeTeamModal}>Close</button>
            <h2 style={styles.modalHeader}>Team Members</h2>
            <div>
              {teamEmails.length > 0 ? (
                teamEmails.map((email, index) => <p key={index} style={styles.teamMember}>{email}</p>)
              ) : (
                <p style={styles.teamMember}>No team members.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  body: {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#121212",
    color: "#ffffff",
    textAlign: "center",
    padding: "20px",
    minHeight: "100vh",
  },
  backBtn: {
    position: "absolute",
    top: "10px",
    left: "10px",
    background: "rgba(227, 236, 239, 0.1)",
    color: "rgba(255, 255, 255, 0.7)",
    border: "none",
    padding: "5px 10px",
    fontSize: "12px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "0.3s",
  },
  header: {
    fontSize: "2em",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #004d00, #b8860b)",
    padding: "15px",
    borderRadius: "8px",
  },
  tableWrapper: {
    overflowX: "auto",
    marginTop: "20px",
    borderRadius: "6px",
    border: "1px solid #444",
  },
  table: {
    width: "100%",
    minWidth: "500px",
    borderCollapse: "collapse",
    fontSize: "16px",
  },
  th: {
    border: "1px solid #ffffff",
    padding: "12px",
    textAlign: "center",
    background: "linear-gradient(135deg, #004d00, #b8860b)",
  },
  td: {
    border: "1px solid #ffffff",
    padding: "12px",
    textAlign: "center",
  },
  viewTeamBtn: {
    background: "#03458b",
    color: "#fff",
    border: "none",
    padding: "2px 8px",
    fontSize: "12px",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background 0.3s",
  },
  modal: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "fixed",
    zIndex: 2000,
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    overflow: "auto",
    background: "rgba(0, 0, 0, 0.75)",
  },
  modalContent: {
    background: "#1e1e1e",
    margin: "auto",
    padding: "20px",
    borderRadius: "5px",
    width: "90%",
    maxWidth: "300px",
    textAlign: "left",
    color: "#fff",
  },
  modalHeader: {
    marginTop: 0,
  },
  closeModalBtn: {
    background: "#dc3545",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "4px",
    float: "right",
  },
  teamMember: {
    margin: "5px 0",
  },
};

export default ReferralManagement;
