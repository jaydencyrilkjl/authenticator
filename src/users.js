import React, { useEffect, useState } from "react";
import StyledAlert from "./components/StyledAlert"; // Import StyledAlert

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [alertMessage, setAlertMessage] = useState(""); // State for alert message
  const [alertCallback, setAlertCallback] = useState(null); // Callback for alert actions
  const [searchTerm, setSearchTerm] = useState(""); // Add search state

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("https://tradespots.online/api/admin/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setAlertMessage("Error fetching users. Please try again."); // Set alert message
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchUsers();
      return;
    }
    try {
      // Try searching by spotId first
      let response = await fetch(
        `https://tradespots.online/api/admin/search-users?q=${encodeURIComponent(searchTerm.trim())}&field=spotId`
      );
      let data = await response.json();
      // If no results, try searching by email
      if (!Array.isArray(data) || data.length === 0) {
        response = await fetch(
          `https://tradespots.online/api/admin/search-users?q=${encodeURIComponent(searchTerm.trim())}&field=email`
        );
        data = await response.json();
      }
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setAlertMessage("Error searching users. Please try again.");
    }
  };

  const openActionModal = (userId) => {
    setCurrentUserId(userId);
    setActionModalVisible(true);
  };

  const closeActionModal = () => {
    setActionModalVisible(false);
    setCurrentUserId(null);
  };

  const openMessageModal = (userId) => {
    setCurrentUserId(userId);
    setMessageModalVisible(true);
  };

  const closeMessageModal = () => {
    setMessageModalVisible(false);
    setMessageText("");
  };

  const deleteUser = async (userId) => {
    try {
      const response = await fetch(`https://tradespots.online/api/admin/delete-user/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success) {
        setAlertMessage("User deleted successfully!");
        setUsers(users.filter(user => user._id !== userId)); // Update UI immediately
      } else {
        setAlertMessage("Error deleting user: " + data.error);
      }
      closeActionModal();
    } catch (error) {
      setAlertMessage("Request failed: " + error);
      closeActionModal();
    }
  };

  const updateUser = async (userId) => {
    const newBalance = prompt("Enter new balance:");
    if (newBalance !== null && !isNaN(newBalance) && newBalance.trim() !== "") {
      try {
        const response = await fetch(`https://tradespots.online/api/admin/update-balance/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ balance: parseFloat(newBalance) }),
        });
        const data = await response.json();
        if (data.success) {
          setAlertMessage("Balance updated successfully!");
          setUsers(users.map(user =>
            user._id === userId ? { ...user, balance: parseFloat(newBalance) } : user
          )); // Update UI immediately
        } else {
          setAlertMessage("Error updating balance: " + data.error);
        }
        closeActionModal();
      } catch (error) {
        setAlertMessage("Request failed: " + error);
        closeActionModal();
      }
    } else {
      setAlertMessage("Invalid input. Please enter a valid number.");
    }
  };

  const updateSpotBalance = async (userId) => {
    const newSpotBalance = prompt("Enter new SPOT balance:");
    if (newSpotBalance !== null && !isNaN(newSpotBalance) && newSpotBalance.trim() !== "") {
      try {
        const response = await fetch(`https://tradespots.online/api/admin/update-spotbalance/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spotBalance: parseFloat(newSpotBalance) }),
        });
        const data = await response.json();
        if (data.success) {
          setAlertMessage("SPOT balance updated successfully!");
          setUsers(users.map(user =>
            user._id === userId ? { ...user, spotBalance: parseFloat(newSpotBalance) } : user
          ));
        } else {
          setAlertMessage("Error updating SPOT balance: " + data.error);
        }
        closeActionModal();
      } catch (error) {
        setAlertMessage("Request failed: " + error);
        closeActionModal();
      }
    } else {
      setAlertMessage("Invalid input. Please enter a valid number.");
    }
  };

  const updateEmail = async (userId) => {
    const newEmail = prompt("Enter new email:");
    if (newEmail) {
      try {
        const response = await fetch(`https://tradespots.online/api/admin/update-user/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail.trim() }),
        });
        const data = await response.json();
        if (data.success) {
          setAlertMessage("Email updated successfully!");
          setUsers(users.map(user =>
            user._id === userId ? { ...user, email: newEmail.trim() } : user
          )); // Update UI immediately
        } else {
          setAlertMessage("Error updating email: " + data.error);
        }
        closeActionModal();
      } catch (error) {
        setAlertMessage("Request failed: " + error);
        closeActionModal();
      }
    }
  };

  const updateWallet = async (userId) => {
    const newWalletAddress = prompt("Enter new wallet address:");
    if (newWalletAddress) {
      try {
        const response = await fetch(`https://tradespots.online/api/admin/update-user/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: newWalletAddress.trim() }),
        });
        const data = await response.json();
        if (data.success) {
          setAlertMessage("Wallet address updated successfully!");
          setUsers(users.map(user =>
            user._id === userId ? { ...user, walletAddress: newWalletAddress.trim() } : user
          )); // Update UI immediately
        } else {
          setAlertMessage("Error updating wallet address: " + data.error);
        }
        closeActionModal();
      } catch (error) {
        setAlertMessage("Request failed: " + error);
        closeActionModal();
      }
    }
  };

  const sendMessageToUser = async (userId) => {
    if (!messageText.trim()) {
        setAlertMessage("Message cannot be empty."); // Set alert message
        return;
    }
    try {
        const response = await fetch(`https://tradespots.online/api/admin/send-message/${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: messageText }),
        });
        const data = await response.json();
        if (data.success) {
            setAlertMessage("Message sent successfully!"); // Set alert message
            closeMessageModal();
        } else {
            setAlertMessage("Error sending message: " + data.error); // Set alert message
        }
    } catch (error) {
        setAlertMessage("Request failed: " + error); // Set alert message
    }
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
      <div style={styles.header}>User Management</div>
      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ margin: "20px auto", maxWidth: 400, display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Search by Spot ID or Email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
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
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Balance</th>
              <th style={styles.th}>SPOT Balance</th>
              <th style={styles.th}>Wallet Address</th>
              <th style={styles.th}>Spot ID</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6">
                  {searchTerm.trim() ? "Not found" : "Loading users..."}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>${user.balance.toFixed(2)}</td>
                  <td style={styles.td}>{typeof user.spotBalance === 'number' ? user.spotBalance.toFixed(6) : '0.000000'}</td>
                  <td style={styles.td}>{user.walletAddress}</td>
                  <td style={styles.td}>{user.spotId}</td>
                  <td style={styles.td}>
                    <button style={styles.actionBtn} onClick={() => openActionModal(user._id)}>Manage</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      {actionModalVisible && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && closeActionModal()}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalHeaderTitle}>Manage User</h2>
              <button style={styles.close} onClick={closeActionModal}>&times;</button>
            </div>
            <table style={styles.modalTable}>
              <tbody>
                <tr>
                  <td style={styles.modalTableCell}>
                    <button
                      style={styles.modalButton}
                      onClick={() => updateUser(currentUserId)}
                    >
                      Update Balance
                    </button>
                  </td>
                </tr>
                <tr>
                  <td style={styles.modalTableCell}>
                    <button
                      style={styles.modalButton}
                      onClick={() => updateSpotBalance(currentUserId)}
                    >
                      Update SPOT Balance
                    </button>
                  </td>
                </tr>
                <tr>
                  <td style={styles.modalTableCell}>
                    <button
                      style={styles.modalButton}
                      onClick={() => updateEmail(currentUserId)}
                    >
                      Change Email
                    </button>
                  </td>
                </tr>
                <tr>
                  <td style={styles.modalTableCell}>
                    <button
                      style={styles.modalButton}
                      onClick={() => updateWallet(currentUserId)}
                    >
                      Change Wallet Address
                    </button>
                  </td>
                </tr>
                <tr>
                  <td style={styles.modalTableCell}>
                    <button
                      style={styles.modalButton}
                      onClick={() => openMessageModal(currentUserId)}
                    >
                      Send Message
                    </button>
                  </td>
                </tr>
                <tr>
                  <td style={styles.modalTableCell}>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => deleteUser(currentUserId)}
                    >
                      Delete User
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModalVisible && (
        <div style={{
          ...styles.modal,
          backgroundColor: "rgba(0,0,0,0.7)",
          zIndex: 20,
        }} onClick={(e) => e.target === e.currentTarget && closeMessageModal()}>
          <div style={{
            ...styles.modalContent,
            width: 400,
            maxWidth: '90vw',
            padding: 32,
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            background: 'linear-gradient(135deg, #181818 80%, #222 100%)',
            color: '#fff',
            position: 'relative',
            minHeight: 260,
          }}>
            <div style={{ ...styles.modalHeader, marginBottom: 18 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#b8860b', letterSpacing: 1 }}>Send Message</h2>
              <button style={{ ...styles.close, color: "#ff4d4f", fontSize: 30, marginLeft: 8 }} onClick={closeMessageModal}>&times;</button>
            </div>
            <textarea
              rows="6"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              style={{
                width: "100%",
                minHeight: 100,
                resize: "vertical",
                marginTop: 10,
                padding: 14,
                borderRadius: 8,
                border: "1.5px solid #b8860b",
                background: "#181818",
                color: "#fff",
                fontSize: 16,
                fontFamily: 'inherit',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(184,134,11,0.08)',
                transition: 'border 0.2s',
              }}
            />
            <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button style={{ ...styles.actionBtn, minWidth: 90, fontWeight: 600, fontSize: 15 }} onClick={() => sendMessageToUser(currentUserId)}>Send</button>
              <button style={{ ...styles.actionBtn, minWidth: 90, background: '#333', color: '#fff', fontWeight: 600, fontSize: 15 }} onClick={closeMessageModal}>Cancel</button>
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
    backgroundColor: "#000000", // Changed to black
    color: "#ffffff",
    textAlign: "center",
    padding: "20px",
    minHeight: "100vh", // Ensures the background covers the entire viewport
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
    marginBottom: "20px",
  },
  tableContainer: {
    overflowX: "auto",
    marginTop: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    border: "1px solid #b8860b",
    padding: "10px",
    textAlign: "center",
    background: "linear-gradient(135deg, #004d00, #b8860b)",
  },
  td: {
    border: "1px solid #b8860b",
    padding: "10px",
    textAlign: "center",
  },
  actionBtn: {
    background: "#b8860b",
    color: "white",
    border: "none",
    padding: "5px 10px",
    cursor: "pointer",
    borderRadius: "5px",
    transition: "0.3s",
    margin: "2px",
  },
  deleteBtn: {
    background: "red",
    color: "white",
    border: "none",
    padding: "6px",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "0.3s",
  },
  modal: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "fixed",
    zIndex: 10,
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    overflow: "auto",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#1e1e1e",
    margin: "15% auto",
    padding: "20px",
    borderRadius: "8px",
    width: "280px",
    color: "#fff",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalHeaderTitle: {
    margin: 0,
    fontSize: "18px",
  },
  close: {
    fontSize: "24px",
    cursor: "pointer",
    border: "none",
    background: "none",
    color: "#fff",
  },
  modalTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
  },
  modalTableCell: {
    padding: "8px",
    border: "1px solid #444",
  },
  modalButton: {
    width: "100%",
    padding: "6px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    background: "#b8860b",
    color: "white",
    transition: "0.3s",
  },
  modalButtonHover: {
    background: "#ffaa00",
  },
  deleteBtnHover: {
    background: "darkred",
  },
};

export default UserManagement;
