import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert"; // Import StyledAlert

const DepositManagement = () => {
  const [deposits, setDeposits] = useState([]);
  const [selectedDepositId, setSelectedDepositId] = useState(null);
  const [selectedDepositTxid, setSelectedDepositTxid] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [txidModalVisible, setTxidModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState(""); // State for alert message
  const [alertCallback, setAlertCallback] = useState(null); // Callback for alert actions
  const navigate = useNavigate();

  useEffect(() => {
    // Apply global styles to the body element
    document.body.style.backgroundColor = "#121212";
    document.body.style.margin = "0";
    document.body.style.color = "#ffffff";

    // Cleanup to reset styles when the component unmounts
    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.margin = "";
      document.body.style.color = "";
    };
  }, []);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const response = await fetch("https://tradespots.online/api/admin/deposits");
      if (!response.ok) throw new Error("Failed to fetch deposits");
      const deposits = await response.json();
      setDeposits(deposits.filter((d) => d.status === "pending"));
    } catch (error) {
      console.error("Error fetching deposits:", error);
    }
  };

  const handleAction = async (status) => {
    if (!selectedDepositId) return;
    // Close the popup immediately
    closePopup();
    try {
      const response = await fetch(`https://tradespots.online/api/admin/deposits/${selectedDepositId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update deposit");
      const result = await response.json();
      setAlertMessage(result.message); // Set alert message
      setAlertCallback(() => () => {
        fetchDeposits();
      });
    } catch (error) {
      console.error("Error updating deposit:", error);
      setAlertMessage("An error occurred while updating the deposit."); // Set alert message
    }
  };

  const openPopup = (depositId, txid) => {
    setSelectedDepositId(depositId);
    setSelectedDepositTxid(txid);
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
    setSelectedDepositId(null);
    setSelectedDepositTxid(null);
  };

  const openTxidModal = () => {
    setTxidModalVisible(true);
  };

  const closeTxidModal = () => {
    setTxidModalVisible(false);
  };

  const copyTxid = () => {
    navigator.clipboard.writeText(selectedDepositTxid).then(() => {
      setAlertMessage("Transaction ID copied to clipboard."); // Set alert message
    });
  };

  const bodyStyle = {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#121212",
    color: "#ffffff",
    textAlign: "center",
    padding: "20px",
    fontSize: "14px",
    maxWidth: "100%",
    overflowX: "hidden",
  };

  const tableContainerStyle = {
    overflowX: "auto",
    marginTop: "20px",
  };

  const tableStyle = {
    width: "100%",
    marginTop: "20px",
    borderCollapse: "collapse",
    fontSize: "13px",
  };

  const thStyle = {
    border: "1px solid #ffffff",
    padding: "10px",
    textAlign: "left",
    background: "linear-gradient(135deg, #004d00, #b8860b)",
  };

  const tdStyle = {
    border: "1px solid #ffffff",
    padding: "10px",
    textAlign: "left",
  };

  const backButtonStyle = {
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
  };

  const headerStyle = {
    fontSize: "1.5em",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #004d00, #b8860b)",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "10px",
  };

  const paragraphStyle = {
    background: "rgba(255, 255, 255, 0.1)",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "2px 2px 10px rgba(255, 255, 255, 0.2)",
    display: "inline-block",
    textAlign: "center",
  };

  const actionButtonStyle = {
    backgroundColor: "#b8860b",
    color: "#ffffff",
    border: "none",
    padding: "5px 10px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    fontSize: "13px",
    marginRight: "5px",
  };

  const actionButtonHoverStyle = {
    backgroundColor: "#8b5e00",
  };

  const modalStyle = {
    display: "block",
    position: "fixed",
    zIndex: 10,
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    overflow: "auto",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  };

  const modalContentStyle = {
    backgroundColor: "#222",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    padding: "10px",
    border: "1px solid #888",
    width: "90%",
    maxWidth: "400px",
    borderRadius: "8px",
    textAlign: "center",
    fontSize: "12px",
  };

  const modalHeaderStyle = {
    marginTop: "0",
    marginBottom: "15px",
    fontSize: "16px",
  };

  const copyButtonStyle = {
    backgroundColor: "#b8860b",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    marginTop: "10px",
    cursor: "pointer",
    borderRadius: "4px",
  };

  return (
    <div style={bodyStyle}>
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

      <button onClick={() => navigate(-1)} style={backButtonStyle}>← Back</button>
      <div style={headerStyle}>Deposit Management</div>
      <p style={paragraphStyle}>Manage deposits from this page.</p>
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>User</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deposits.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>No Pending Deposit</td>
              </tr>
            ) : (
              deposits.map((deposit) => (
                <tr key={deposit._id}>
                  <td style={tdStyle}>{deposit.userId?.email || "Unknown"}</td>
                  <td style={tdStyle}>{deposit.amount} USDT</td>
                  <td style={tdStyle}>{deposit.status}</td>
                  <td style={tdStyle}>
                    <button
                      style={actionButtonStyle}
                      onMouseOver={(e) => (e.target.style.backgroundColor = actionButtonHoverStyle.backgroundColor)}
                      onMouseOut={(e) => (e.target.style.backgroundColor = actionButtonStyle.backgroundColor)}
                      onClick={() => openPopup(deposit._id, deposit.txid)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Popup Modal */}
      {popupVisible && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h3 style={modalHeaderStyle}>Manage Deposit</h3>
            <button style={{ ...actionButtonStyle, backgroundColor: "#28a745" }} onClick={() => handleAction("approved")}>Approve</button>
            <button style={{ ...actionButtonStyle, backgroundColor: "#dc3545" }} onClick={() => handleAction("rejected")}>Reject</button>
            <button style={actionButtonStyle} onClick={openTxidModal}>View TxID</button>
            <br />
            <button style={{ ...actionButtonStyle, backgroundColor: "#6c757d" }} onClick={closePopup}>Cancel</button>
          </div>
        </div>
      )}

      {/* TxID Modal */}
      {txidModalVisible && (
        <div style={modalStyle}>
          <div style={{ ...modalContentStyle, width: "90%", maxWidth: "300px" }}>
            <h3 style={modalHeaderStyle}>Transaction ID</h3>
            <p style={{ wordBreak: "break-all", color: "#ffffff" }}>{selectedDepositTxid}</p>
            <button style={copyButtonStyle} onClick={copyTxid}>Copy</button>
            <br />
            <button style={{ ...actionButtonStyle, backgroundColor: "#6c757d" }} onClick={closeTxidModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositManagement;
