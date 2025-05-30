import React, { useEffect, useState } from "react";
import StyledAlert from "./components/StyledAlert"; // Import StyledAlert

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [currentWithdrawalId, setCurrentWithdrawalId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState(""); // State for alert message
  const [alertCallback, setAlertCallback] = useState(null); // Callback for alert actions

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch("https://tradespots.online/api/admin/get-funds");
      const data = await response.json();
      setWithdrawals(data);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      setAlertMessage("Error fetching withdrawals. Please try again."); // Set alert message
    }
  };

  const openModal = (id) => {
    setCurrentWithdrawalId(id);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCurrentWithdrawalId(null);
  };

  const updateWithdrawal = async (id, status) => {
    try {
      const response = await fetch("https://tradespots.online/api/admin/update-withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (result.success) {
        setAlertMessage(`Withdrawal ${status} successfully!`);
        fetchWithdrawals(); // Refresh withdrawals
      } else {
        setAlertMessage("Action failed: " + result.error); // Set alert message
      }
    } catch (error) {
      console.error("Error updating withdrawal:", error);
      setAlertMessage("An unexpected error occurred: " + error.message); // Set alert message
    }
  };

  const approveModal = async () => {
    await updateWithdrawal(currentWithdrawalId, "approved");
    closeModal();
  };

  const rejectModal = async () => {
    await updateWithdrawal(currentWithdrawalId, "rejected");
    closeModal();
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
      <div style={styles.header}>Withdrawal Management</div>
      <p>Manage withdrawals from this page.</p>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Amount (USDT)</th>
              <th style={styles.th}>Wallet Address</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan="4" style={styles.td}>No Pending Withdrawal</td>
              </tr>
            ) : (
              withdrawals.map((withdrawal) => (
                <tr key={withdrawal._id}>
                  <td style={styles.td}>{withdrawal.username || "Unknown"}</td>
                  <td style={styles.td}>{withdrawal.amount}</td>
                  <td style={styles.td}>{withdrawal.wallet}</td>
                  <td style={styles.td}>
                    <button style={styles.manageBtn} onClick={() => openModal(withdrawal._id)}>Manage</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalVisible && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={closeModal}>&times;</span>
            <h3>Manage Withdrawal</h3>
            <div style={styles.modalButtons}>
              <button style={styles.approveBtn} onClick={approveModal}>Approve</button>
              <button style={styles.rejectBtn} onClick={rejectModal}>Reject</button>
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
  tableContainer: {
    overflowX: "auto",
    marginTop: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "500px",
  },
  th: {
    border: "1px solid #ffffff",
    padding: "10px",
    textAlign: "center",
  },
  td: {
    border: "1px solid #ffffff",
    padding: "10px",
    textAlign: "center",
  },
  manageBtn: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "5px 10px",
    fontSize: "12px",
    cursor: "pointer",
    borderRadius: "5px",
    transition: "background-color 0.3s",
  },
  modal: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "fixed",
    zIndex: 9999,
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    backgroundColor: "#1e1e1e",
    margin: "20% auto",
    padding: "15px",
    border: "1px solid #888",
    width: "80%",
    maxWidth: "300px",
    borderRadius: "10px",
    color: "#fff",
    textAlign: "center",
  },
  close: {
    color: "#aaa",
    float: "right",
    fontSize: "24px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  modalButtons: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: "20px",
  },
  approveBtn: {
    backgroundColor: "green",
    color: "white",
    border: "none",
    padding: "5px 10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  rejectBtn: {
    backgroundColor: "red",
    color: "white",
    border: "none",
    padding: "5px 10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default Withdrawals;
