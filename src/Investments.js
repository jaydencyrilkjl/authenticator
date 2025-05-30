import React, { useEffect, useState } from "react";

const InvestmentManagement = () => {
  const [investments, setInvestments] = useState([]);
  const [currentInvestment, setCurrentInvestment] = useState(null);
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [searchEmail, setSearchEmail] = useState(""); // Add search state

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async (filterStatus = "", email = "") => {
    try {
      let url = "https://tradespots.online/api/investments";
      if (email) {
        url += `?email=${encodeURIComponent(email.trim())}`;
      } else if (filterStatus) {
        url += `?status=${filterStatus}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch investments: ${response.statusText}`);
      const data = await response.json();
      // If searching by email, filter client-side to only show investments for that email
      if (email) {
        setInvestments(
          Array.isArray(data)
            ? data.filter(inv => inv.userId && inv.userId.email && inv.userId.email.toLowerCase() === email.trim().toLowerCase())
            : []
        );
      } else {
        setInvestments(data);
      }
    } catch (error) {
      console.error("Error fetching investments:", error);
    }
  };

  const openManageModal = (investment) => {
    setCurrentInvestment(investment);
    setManageModalVisible(true);
  };

  const closeManageModal = () => {
    setManageModalVisible(false);
    setCurrentInvestment(null);
  };

  const updateInvestmentStatus = async (investmentId, status) => {
    try {
      const response = await fetch(`https://tradespots.online/api/admin/update-investment-status-only/${investmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(`Failed to update investment status: ${response.statusText}`);
      fetchInvestments();
      closeManageModal();
    } catch (error) {
      console.error("Error updating investment status:", error);
    }
  };

  const deleteInvestment = async () => {
    try {
      const response = await fetch(`https://tradespots.online/api/admin/delete-investment/${currentInvestment._id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Failed to delete investment: ${response.statusText}`);
      fetchInvestments();
      closeManageModal();
    } catch (error) {
      console.error("Error deleting investment:", error);
    }
  };

  const addInvestment = async () => {
    const plan = prompt("Enter the investment plan (SPOT1, SPOT2, SPOT3, SPOT4, SPOT5, SPOT6, SPOT7, SPOT8):");
    if (!plan) return;

    const plans = {
      SPOT1: { amount: 30, dailyEarnings: 30 * 0.025 },
      SPOT2: { amount: 50, dailyEarnings: 50 * 0.025 },
      SPOT3: { amount: 100, dailyEarnings: 100 * 0.025 },
      SPOT4: { amount: 230, dailyEarnings: 230 * 0.025 },
      SPOT5: { amount: 500, dailyEarnings: 500 * 0.03 },
      SPOT6: { amount: 1000, dailyEarnings: 1000 * 0.03 },
      SPOT7: { amount: 5000, dailyEarnings: 5000 * 0.03 },
      SPOT8: { amount: 10000, dailyEarnings: 10000 * 0.03 },
    };

    if (!plans[plan]) {
      return;
    }

    const { amount, dailyEarnings } = plans[plan];
    try {
      const response = await fetch("https://tradespots.online/api/investments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentInvestment.userId,
          plan,
          amount,
          dailyEarnings,
          ignoreBalance: true,
        }),
      });
      if (!response.ok) throw new Error("Failed to add investment.");
      fetchInvestments();
      closeManageModal();
    } catch (error) {
      console.error("Error adding investment:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) {
      fetchInvestments();
    } else {
      fetchInvestments("", searchEmail);
    }
  };

  return (
    <div style={styles.body}>
      <button onClick={() => window.history.back()} style={styles.backBtn}>← Back</button>
      <div style={styles.header}>Investment Management</div>
      <p>Manage investments from this page.</p>

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
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {investments.length === 0 ? (
              <tr>
                <td colSpan="4" style={styles.td}>
                  {searchEmail.trim() ? "Not found" : "No investments"}
                </td>
              </tr>
            ) : (
              investments.map((investment, index) => (
                <tr key={index}>
                  <td style={styles.td}>{investment.userId?.email || "Unknown"}</td>
                  <td style={styles.td}>{investment.amount}</td>
                  <td style={styles.td}>{investment.status}</td>
                  <td style={styles.td}>
                    <button style={styles.manageBtn} onClick={() => openManageModal(investment)}>Manage</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {manageModalVisible && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && closeManageModal()}>
          <div style={styles.modalContent}>
            <table style={styles.modalTable}>
              <thead>
                <tr>
                  <th colSpan="2" style={styles.modalTh}>Manage Investment</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.modalTd}>
                    <button style={styles.actionBtn} onClick={() => updateInvestmentStatus(currentInvestment._id, "completed")}>Complete</button>
                  </td>
                  <td style={styles.modalTd}>
                    <button style={styles.actionBtn} onClick={() => updateInvestmentStatus(currentInvestment._id, "cancelled")}>Cancel</button>
                  </td>
                </tr>
                <tr>
                  <td colSpan="2" style={styles.modalTd}>
                    <button style={styles.deleteBtn} onClick={deleteInvestment}>Delete</button>
                  </td>
                </tr>
                <tr>
                  <td colSpan="2" style={styles.modalTd}>
                    <button style={styles.actionBtn} onClick={addInvestment}>Add Investment</button>
                  </td>
                </tr>
                <tr>
                  <td colSpan="2" style={styles.modalTd}>
                    <button style={styles.closeBtn} onClick={closeManageModal}>Close</button>
                  </td>
                </tr>
              </tbody>
            </table>
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
    marginBottom: "20px",
  },
  tableWrapper: {
    overflowX: "auto",
    marginTop: "20px",
  },
  table: {
    width: "100%",
    minWidth: "600px",
    borderCollapse: "collapse",
    fontSize: "12px",
  },
  th: {
    border: "1px solid #ffffff",
    padding: "5px",
    textAlign: "left",
  },
  td: {
    border: "1px solid #ffffff",
    padding: "5px",
    textAlign: "left",
  },
  manageBtn: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "5px 10px",
    fontSize: "12px",
    cursor: "pointer",
    borderRadius: "3px",
    transition: "background-color 0.3s",
  },
  modal: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.75)",
    zIndex: 1000,
  },
  modalContent: {
    background: "#1e1e1e",
    padding: "10px",
    borderRadius: "6px",
    width: "280px",
    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
  },
  modalTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
  },
  modalTh: {
    background: "#333",
    color: "#fff",
    padding: "8px",
    textAlign: "center",
  },
  modalTd: {
    padding: "8px",
    textAlign: "center",
  },
  actionBtn: {
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  deleteBtn: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  closeBtn: {
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
};

export default InvestmentManagement;
